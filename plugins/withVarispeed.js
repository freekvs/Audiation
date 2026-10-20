const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * expo-audio builds AVPlayerItem with the default .timeDomain algorithm.
 * iOS then keeps the source pitch when the rate changes, and setting the
 * algorithm after the item is already in the player does not stick.
 * Pitch must be chosen before the item is inserted.
 */
function patch(source, needle, replacement, label) {
  if (source.includes(replacement)) {
    return source;
  }
  if (!source.includes(needle)) {
    throw new Error(`expo-audio ${label} changed; varispeed patch missed.`);
  }
  return source.replace(needle, replacement);
}

function patchExpoAudio(projectRoot) {
  const iosDir = path.join(projectRoot, 'node_modules', 'expo-audio', 'ios');
  const utilsPath = path.join(iosDir, 'AudioUtils.swift');
  const playerPath = path.join(iosDir, 'AudioPlayer.swift');
  const modulePath = path.join(iosDir, 'AudioModule.swift');

  fs.writeFileSync(
    utilsPath,
    patch(
      fs.readFileSync(utilsPath, 'utf8'),
      '    return AVPlayerItem(asset: asset, automaticallyLoadedAssetKeys: [.tracks, .duration])',
      `    let item = AVPlayerItem(asset: asset, automaticallyLoadedAssetKeys: [.tracks, .duration])
    item.audioTimePitchAlgorithm = .varispeed
    return item`,
      'createAVPlayerItem',
    ),
  );

  fs.writeFileSync(
    playerPath,
    patch(
      patch(
        fs.readFileSync(playerPath, 'utf8'),
        `  private func replacePlayerItem(with item: AVPlayerItem?) {
    if let queuePlayer = ref as? AVQueuePlayer {`,
        `  private func replacePlayerItem(with item: AVPlayerItem?) {
    item?.audioTimePitchAlgorithm = .varispeed
    if let queuePlayer = ref as? AVQueuePlayer {`,
        'replacePlayerItem',
      ),
      '    nextItem.audioTimePitchAlgorithm = currentItem.audioTimePitchAlgorithm',
      '    nextItem.audioTimePitchAlgorithm = .varispeed',
      'enqueueNextLoopItem',
    ),
  );

  fs.copyFileSync(path.join(__dirname, 'GlideTone.swift'), path.join(iosDir, 'GlideTone.swift'));

  fs.writeFileSync(
    modulePath,
    patch(
      fs.readFileSync(modulePath, 'utf8'),
      `    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
      try setIsAudioActive(isActive)
    }`,
      `    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
      try setIsAudioActive(isActive)
    }

    Function("setGlideHz") { (hz: Double) -> Bool in
      GlideTone.shared.setHz(hz)
    }

    Function("stopGlide") {
      GlideTone.shared.stop()
    }

    Function("playClickHz") { (hz: Double) in
      GlideTone.shared.playClick(hz)
    }

    Function("stopClickHz") {
      GlideTone.shared.stopClicks()
    }`,
      'glide functions',
    ),
  );

  fs.writeFileSync(
    modulePath,
    patch(
      fs.readFileSync(modulePath, 'utf8'),
      `        player.currentRate = playerRate

        if player.isPlaying {
          player.ref.rate = playerRate
        }

        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .timeDomain
          player.ref.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        } else {
          player.ref.currentItem?.audioTimePitchAlgorithm = .varispeed
        }`,
      `        player.currentRate = playerRate

        if player.shouldCorrectPitch {
          player.pitchCorrectionQuality = pitchCorrectionQuality?.toPitchAlgorithm() ?? .timeDomain
          player.ref.currentItem?.audioTimePitchAlgorithm = player.pitchCorrectionQuality
        } else {
          player.ref.currentItem?.audioTimePitchAlgorithm = .varispeed
          if let queue = player.ref as? AVQueuePlayer {
            for queued in queue.items() {
              queued.audioTimePitchAlgorithm = .varispeed
            }
          }
        }

        if player.isPlaying {
          player.ref.rate = playerRate
        }`,
      'setPlaybackRate',
    ),
  );
}

function withVarispeed(config) {
  return withDangerousMod(config, [
    'ios',
    (mod) => {
      patchExpoAudio(mod.modRequest.projectRoot);
      return mod;
    },
  ]);
}

module.exports = withVarispeed;
module.exports.patchExpoAudio = patchExpoAudio;
