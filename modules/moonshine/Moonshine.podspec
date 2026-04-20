require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "Moonshine"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/usefulsensors/moonshine"
  s.license      = "MIT"
  s.authors      = { "VoiceNote Team" => "team@voicenote.app" }
  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/usefulsensors/moonshine.git", :tag => "#{s.version}" }

  # IMPORTANT: iOS implementation is in the main app target (ios/voicenote/) to access
  # Swift Package Manager dependencies (MoonshineVoice SDK).
  #
  # This podspec exists for CodeGen and autolinking purposes only.
  # The actual Swift implementation is at: ios/voicenote/MoonshineModule.swift
  #
  # MoonshineVoice SDK must be added via Swift Package Manager in Xcode:
  # File → Add Package Dependencies → https://github.com/moonshine-ai/moonshine-swift.git
  # Version: 0.0.49 or later

  s.source_files = "ios/Empty.m"

  # React Native dependencies for TurboModule support
  s.dependency "React-Core"
  s.dependency "ReactCommon"
  s.dependency "ReactCodegen"
end
