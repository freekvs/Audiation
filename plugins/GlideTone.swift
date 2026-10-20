import AVFoundation
import Foundation

/// Live sine plus short clicks on one engine, so pitch follows a finger without reloading files.
final class GlideTone {
  static let shared = GlideTone()

  private let engine = AVAudioEngine()
  private let lock = NSLock()
  private var source: AVAudioSourceNode?
  private var sampleRate: Double = 48000
  private var glideTarget: Double = 0
  private var glideHz: Double = 0
  private var glidePhase: Double = 0
  private var glideAmp: Double = 0
  private var pendingClicks: [Double] = []
  private var clearClicks = false
  private var clickBusy = false
  private var voices: [(hz: Double, phase: Double, amp: Double)] = []
  private var pauseTicket = 0

  private init() {}

  @discardableResult
  func setHz(_ hz: Double) -> Bool {
    let clamped = min(4186, max(27.5, hz))
    lock.lock()
    glideTarget = clamped
    lock.unlock()
    startOnMain()
    return true
  }

  func stop() {
    lock.lock()
    glideTarget = 0
    lock.unlock()
    schedulePause()
  }

  func playClick(_ hz: Double) {
    let clamped = min(4186, max(40, hz))
    lock.lock()
    pendingClicks.append(clamped)
    if pendingClicks.count > 24 {
      pendingClicks.removeFirst(pendingClicks.count - 24)
    }
    lock.unlock()
    startOnMain()
  }

  func stopClicks() {
    lock.lock()
    pendingClicks.removeAll()
    clearClicks = true
    lock.unlock()
  }

  private func startOnMain() {
    if Thread.isMainThread {
      ensureStarted()
    } else {
      DispatchQueue.main.async { [weak self] in
        self?.ensureStarted()
      }
    }
  }

  private func ensureStarted() {
    let session = AVAudioSession.sharedInstance()
    try? session.setActive(true)
    let rate = session.sampleRate > 0 ? session.sampleRate : 48000
    sampleRate = rate
    if source == nil {
      guard let format = AVAudioFormat(standardFormatWithSampleRate: rate, channels: 2) else {
        return
      }
      let node = AVAudioSourceNode(format: format) { [weak self] _, _, frameCount, audioBufferList in
        self?.render(frameCount: frameCount, list: audioBufferList)
        return noErr
      }
      engine.attach(node)
      engine.connect(node, to: engine.mainMixerNode, format: format)
      source = node
    }
    if !engine.isRunning {
      engine.prepare()
      try? engine.start()
    }
  }

  private func schedulePause() {
    pauseTicket += 1
    let ticket = pauseTicket
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
      guard let self, ticket == self.pauseTicket else {
        return
      }
      self.lock.lock()
      let idle = self.glideTarget == 0 && self.pendingClicks.isEmpty && !self.clickBusy
      self.lock.unlock()
      if idle, self.engine.isRunning {
        self.engine.pause()
      }
    }
  }

  private func render(frameCount: AVAudioFrameCount, list: UnsafeMutablePointer<AudioBufferList>) {
    let count = Int(frameCount)
    if count == 0 {
      return
    }
    lock.lock()
    let target = glideTarget
    let queued = pendingClicks
    pendingClicks.removeAll()
    let reset = clearClicks
    clearClicks = false
    lock.unlock()

    if reset {
      voices.removeAll()
    }
    for hz in queued {
      if let index = voices.firstIndex(where: { $0.amp < 0.001 }) {
        voices[index] = (hz: hz, phase: 0, amp: 0.72)
      } else if voices.count < 8 {
        voices.append((hz: hz, phase: 0, amp: 0.72))
      } else {
        voices[0] = (hz: hz, phase: 0, amp: 0.72)
      }
    }

    let abl = UnsafeMutableAudioBufferListPointer(list)
    let sr = sampleRate > 0 ? sampleRate : 48000
    let twoPi = 2.0 * Double.pi
    let glideCoeff = 1 - exp(-1.0 / (sr * 0.012))
    let clickDecay = exp(-16.0 / sr)

    for frame in 0..<count {
      if glideHz < 1, target > 0 {
        glideHz = target
      }
      glideHz += (target - glideHz) * glideCoeff
      let ampTarget = target > 0 ? 0.22 : 0.0
      glideAmp += (ampTarget - glideAmp) * glideCoeff
      var sample = sin(glidePhase) * glideAmp
      if glideHz > 0 {
        glidePhase += twoPi * glideHz / sr
        if glidePhase > twoPi {
          glidePhase -= twoPi
        }
      }
      for index in voices.indices {
        let voice = voices[index]
        if voice.amp < 0.0008 {
          continue
        }
        sample += sin(voice.phase) * voice.amp
        var phase = voice.phase + twoPi * voice.hz / sr
        if phase > twoPi {
          phase -= twoPi
        }
        voices[index] = (hz: voice.hz, phase: phase, amp: voice.amp * clickDecay)
      }
      let clipped = Float(max(-1.0, min(1.0, sample)))
      for buffer in abl {
        guard let data = buffer.mData else {
          continue
        }
        data.assumingMemoryBound(to: Float.self)[frame] = clipped
      }
    }
    let busy = voices.contains { $0.amp > 0.001 }
    lock.lock()
    clickBusy = busy
    lock.unlock()
  }
}
