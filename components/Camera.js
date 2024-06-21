import React, { useState, useRef } from 'react';
import { CameraView } from 'expo-camera';
import {StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import VideoToImages from './VideoToText';

export default function Eyeris() {
  const VIBRATION = [200];
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [lastResponse, setLastResponse] = useState('');
  let cameraRef = useRef(null);

  const recordVideo = async () => {
    setVideoUri(null);
    setRecording(true);
    let options = {
      maxDuration: 7,
    };
    Vibration.vibrate(VIBRATION);
    const video = await cameraRef.current.recordAsync(options);
    setRecording(false);
    setVideoUri(video.uri);
  };

  const stopRecording = async () => {
    Vibration.vibrate(VIBRATION);
    setRecording(false);
    cameraRef.current.stopRecording();
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={"back"} ref={cameraRef} mode="video" mute={true}>
        <VideoToImages 
          videoUri={videoUri} 
          lastResponse={lastResponse} 
          setLastResponse={setLastResponse}
        />
        {lastResponse != "Loading..." && <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.recordButton, recording ? styles.stopButton : styles.startButton]}
            onPress={() => {
              if (!recording) {
                recordVideo();
              } else {
                stopRecording();
              }
            }}
          >
            <Text style={styles.recordText}>{recording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>     
        </View>}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    padding: 20,
  },
  recordButton: {
    borderRadius: 50,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#ff0000',
  },
  stopButton: {
    backgroundColor: '#00ff00',
  },
  recordText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  }
});
