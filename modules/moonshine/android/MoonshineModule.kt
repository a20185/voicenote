package com.voicenote.modules

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import ai.moonshine.voice.JNI
import ai.moonshine.voice.MicTranscriber
import ai.moonshine.voice.TranscriptEvent
import ai.moonshine.voice.TranscriptEventListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File

/**
 * Moonshine Turbo Module for Android
 *
 * Provides streaming speech recognition using Moonshine ONNX models.
 * Uses MicTranscriber from ai.moonshine.voice package.
 */
class MoonshineModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var transcriber: MicTranscriber? = null
    private var isRecording = false
    private var currentText = ""
    private var lineId = 0
    private var hasMicPermission = false
    private var listenerCount = 0
    private val scope = CoroutineScope(Dispatchers.Main)

    override fun getName(): String = "MoonshineModule"

    /**
     * Check if Moonshine is available
     */
    @ReactMethod
    fun isAvailable(promise: Promise) {
        promise.resolve(true)
    }

    /**
     * Load a Moonshine model from local path
     * @param modelPath - Path to the model directory containing ONNX files
     * @param arch - Model architecture ("small" or "base")
     */
    @ReactMethod
    fun loadModel(modelPath: String, arch: String, promise: Promise) {
        try {
            // Clean up existing transcriber
            transcriber?.stop()
            transcriber = null

            // Create new transcriber
            transcriber = MicTranscriber(reactApplicationContext)

            // Determine model architecture (streaming variants for MicTranscriber)
            // See: https://github.com/usefulsensors/moonshine
            // ModelArch raw values: tiny=0, base=1, tinyStreaming=2, baseStreaming=3, smallStreaming=4, mediumStreaming=5
            val modelArch: Long = when (arch) {
                "tiny" -> 0L
                "base" -> 1L
                "tinyStreaming" -> 2L
                "baseStreaming" -> 3L
                "smallStreaming" -> 4L
                "mediumStreaming" -> 5L
                else -> 3L // default to baseStreaming
            }

            // Load model from path
            // The modelPath should point to a directory containing the model files
            val modelDir = File(modelPath)
            if (!modelDir.exists()) {
                promise.reject("LOAD_ERROR", "Model directory does not exist: $modelPath", null)
                return
            }

            // Extract model name from path (last directory component)
            val modelName = modelDir.name

            // Load from the path - we need to copy assets or use direct path
            // MicTranscriber.loadFromAssets expects files in assets folder
            // For downloaded models, we use loadFromFiles
            transcriber?.loadFromFiles(modelPath, modelArch)

            // Set up event listener
            transcriber?.addListener { event ->
                event.accept(object : TranscriptEventListener {
                    override fun onLineStarted(e: TranscriptEvent.LineStarted) {
                        sendStreamingEvent(
                            type = "line_started",
                            text = "...",
                            isFinal = false,
                            lineId = lineId
                        )
                    }

                    override fun onLineTextChanged(e: TranscriptEvent.LineTextChanged) {
                        sendStreamingEvent(
                            type = "line_text_changed",
                            text = e.line.text,
                            isFinal = false,
                            lineId = lineId
                        )
                        currentText = e.line.text
                    }

                    override fun onLineCompleted(e: TranscriptEvent.LineCompleted) {
                        sendStreamingEvent(
                            type = "line_completed",
                            text = e.line.text,
                            isFinal = true,
                            lineId = lineId
                        )
                        lineId++
                        currentText = e.line.text
                    }
                })
            }

            // If mic permission was already granted, notify the transcriber
            if (hasMicPermission) {
                transcriber?.onMicPermissionGranted()
            }

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("LOAD_ERROR", "Failed to load model: ${e.message}", e)
        }
    }

    /**
     * Notify that microphone permission has been granted
     * Must be called after getting RECORD_AUDIO permission from user
     */
    @ReactMethod
    fun onMicPermissionGranted(promise: Promise) {
        hasMicPermission = true
        transcriber?.onMicPermissionGranted()
        promise.resolve(null)
    }

    /**
     * Unload the current model
     */
    @ReactMethod
    fun unloadModel(promise: Promise) {
        try {
            transcriber?.stop()
            transcriber = null
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("UNLOAD_ERROR", "Failed to unload model: ${e.message}", e)
        }
    }

    /**
     * Check if a model is currently loaded
     */
    @ReactMethod
    fun isModelLoaded(promise: Promise) {
        promise.resolve(transcriber != null)
    }

    /**
     * Debug: Check if EventEmitterCallback is set (New Architecture event support)
     */
    @ReactMethod
    fun hasEventCallback(promise: Promise) {
        promise.resolve(listenerCount > 0)
    }

    /**
     * Start streaming transcription
     */
    @ReactMethod
    fun startStreaming(language: String?, promise: Promise) {
        val t = transcriber
        if (t == null) {
            promise.reject("NO_MODEL", "No model loaded. Call loadModel first.", null)
            return
        }

        if (isRecording) {
            promise.reject("ALREADY_RECORDING", "Already recording", null)
            return
        }

        if (!hasMicPermission) {
            promise.reject("NO_PERMISSION", "Microphone permission not granted. Call onMicPermissionGranted first.", null)
            return
        }

        try {
            isRecording = true
            currentText = ""
            lineId = 0

            t.start()
            promise.resolve(null)
        } catch (e: Exception) {
            isRecording = false
            promise.reject("START_ERROR", "Failed to start streaming: ${e.message}", e)
        }
    }

    /**
     * Stop streaming and get final result
     */
    @ReactMethod
    fun stopStreaming(promise: Promise) {
        if (!isRecording) {
            val result = Arguments.createMap().apply {
                putString("text", currentText)
            }
            promise.resolve(result)
            return
        }

        try {
            isRecording = false
            transcriber?.stop()

            val result = Arguments.createMap().apply {
                putString("text", currentText)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Failed to stop streaming: ${e.message}", e)
        }
    }

    /**
     * Get the list of downloaded models
     */
    @ReactMethod
    fun getDownloadedModels(promise: Promise) {
        val modelsDir = File(reactApplicationContext.filesDir, "moonshine-models")
        if (!modelsDir.exists()) {
            promise.resolve(Arguments.createArray())
            return
        }

        val models = modelsDir.listFiles()
            ?.filter { it.isDirectory }
            ?.map { it.name }
            ?: emptyList()

        val array = Arguments.createArray()
        models.forEach { array.pushString(it) }
        promise.resolve(array)
    }

    /**
     * Delete a downloaded model
     */
    @ReactMethod
    fun deleteModel(modelId: String, promise: Promise) {
        val modelDir = File(reactApplicationContext.filesDir, "moonshine-models/$modelId")
        try {
            if (modelDir.exists()) {
                modelDir.deleteRecursively()
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("DELETE_ERROR", "Failed to delete model: ${e.message}", e)
        }
    }

    /**
     * Get the models directory path
     */
    @ReactMethod
    fun getModelsDirectory(promise: Promise) {
        val modelsDir = File(reactApplicationContext.filesDir, "moonshine-models").absolutePath
        promise.resolve(modelsDir)
    }

    // MARK: - Event Listener Support (required for NativeEventEmitter)

    /**
     * Called by NativeEventEmitter when a listener is added
     * Required for TurboModule event support
     */
    @ReactMethod
    fun addListener(eventName: String, promise: Promise) {
        listenerCount += 1
        // No-op on Android - events are sent via RCTDeviceEventEmitter directly
        promise.resolve(null)
    }

    /**
     * Called by NativeEventEmitter when listeners are removed
     * Required for TurboModule event support
     */
    @ReactMethod
    fun removeListeners(count: Double, promise: Promise) {
        listenerCount = (listenerCount - count.toInt()).coerceAtLeast(0)
        // No-op on Android - events are sent via RCTDeviceEventEmitter directly
        promise.resolve(null)
    }

    // MARK: - Private Helpers

    private fun sendStreamingEvent(
        type: String,
        text: String,
        isFinal: Boolean,
        lineId: Int? = null,
        error: String? = null
    ) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onStreamingEvent", Arguments.createMap().apply {
                putString("type", type)
                putString("text", text)
                putBoolean("isFinal", isFinal)
                lineId?.let { putInt("lineId", it) }
                error?.let { putString("error", it) }
            })
    }
}
