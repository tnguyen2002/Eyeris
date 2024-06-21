import React, {useRef } from 'react';
import { View, Text, StyleSheet} from 'react-native';
import { Video, Audio } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { OPENAI_API_KEY } from '@env';
import OpenAI from "openai";
import { manipulateAsync } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export default function VideoToImages(props) {
  const videoRef = useRef(null);
  const Buffer = require('buffer/').Buffer;

  // Functions from here: https://stackoverflow.com/questions/77960172/play-audio-response-from-openai-tts-api-in-react-native-with-expo
  const toBuffer = async (blob) => {
  const uri = await toDataURI(blob);
  const base64 = uri.replace(/^.*,/g, "");
  return Buffer.from(base64, "base64");
  };

  const toDataURI = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const uri = reader.result?.toString();
        resolve(uri);
      };
    });

  const constructTempFilePath = async (buffer) => {
    const tempFilePath = FileSystem.cacheDirectory + "speech.mp3";
    await FileSystem.writeAsStringAsync(
      tempFilePath,
      buffer.toString("base64"),
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

    return tempFilePath;
  };
  const systemPrompt =
  `You are an assistant that will provide a singluar short and brief descriptive video to text captioning that will be use to help blind people understand their surroundings.`

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  const getOpenAIResponse = async (userMessage) => {
    let messages = [
        { "role": "system", "content": systemPrompt },
    ];


    messages.push(userMessage);

    console.log("API Call...")

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        "max_tokens": 100

    });
    console.log("API Call Done")
    

    const newMessage = {
        role: "assistant",
        content: completion.choices[0].message.content,
    };
    console.log("newMessage")
    console.log(newMessage)
    props.setLastResponse(newMessage.content);

    //text to speech
    const audio = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: newMessage.content,
    });
    console.log("audio")
    console.log(audio)
   
    const blob = await audio.blob();
    const buffer = await toBuffer(blob);
    const tempFilePath = await constructTempFilePath(buffer);
    const { sound } = await Audio.Sound.createAsync({ uri: tempFilePath });
    await sound.playAsync();
  return newMessage.content;
};
  

  const generateThumbnails = async (uri, duration) => {
    let generatedThumbnails = [];
    let userMessage = { "role": "user", "content": [{ type: "text", text: "These are frames from a video. Give me a brief and short description of what I am seeing without mentioning each frame." }] };
    for (let i = 0; i < duration; i += 1000) { // Every second
      const thumbnailResult = await VideoThumbnails.getThumbnailAsync(uri, { time: i });
      if (thumbnailResult.uri) {
          generatedThumbnails.push(thumbnailResult.uri);
          const manipResult = await manipulateAsync(
            thumbnailResult.uri,
            [{resize: {height: 512, width: 512}}],
            { compress: 1, base64: true }
        );
        let resizedImgBase64 = manipResult.base64;
        let resizedUri = `data:image/jpeg;base64,${resizedImgBase64}`;

        userMessage.content.push(
            {
                type: "image_url",
                image_url: {
                    "url": resizedUri,
                    "detail": "low"
                },
            }
        );
      }
    }
    return userMessage;

  };

  return (
    <View style={styles.container}>
      {props.videoUri && (
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: props.videoUri }}
          useNativeControls
          resizeMode="contain"
          onLoad={async (status) => {
            props.setLastResponse('Loading...');
            const duration = status.durationMillis;
            await generateThumbnails(props.videoUri, duration).then(async (userMessage) => {
              const a = await getOpenAIResponse(userMessage);

            })
          }}
          onError={(error) => {
            console.error(`Video loading error: ${error.message}`);
          }}
        />
      )}
      {props.lastResponse !== '' && props.videoUri ? (
      <View style={styles.responseContainer}>
        <Text styles={styles.responseText}>{props.lastResponse}</Text>
      </View>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 20,
  },
  video: {
    width: 50,
    height: 50,
    opacity: 0
    
  },
  responseContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
  },
  responseText: {
    fontSize: 80,
  },
});