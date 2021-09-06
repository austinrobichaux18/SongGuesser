import * as React from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  TextInput,
  ScrollView,
} from "react-native";
import { Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import axios from "axios";

export default function App() {
  {
    const [text, onChangeText] = React.useState("red jumpsui");
    const [artists, setArtists] = React.useState<Artist[]>();
    const onChangeTextLog = async (t) => {
      onChangeText(t);
      console.log(t);
      setArtists(await GetArtists(t));
    };
    return (
      <View style={styles.container}>
        <View>
          <TextInput
            style={styles.input}
            onChangeText={onChangeTextLog}
            value={text}
          />
        </View>
        <View style={{ backgroundColor: "dodgerblue" }}>
          <ScrollView>
            {artists?.map((x) => (
              <Text style={styles.margin}>{x.name}</Text>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }
}

type Artist = {
  id: string;
  name: string;
  picture_small: string;
};

function GetArtists(query: string): Promise<Artist[]> {
  return axios({
    method: "get",
    url: `https://api.deezer.com/search/artist/?q=${query}&limit=20`,
    responseType: "json",
  }).then(function (response) {
    return response.data.data as Artist[];
    console.log(response);
  });
}

function PlaySongButton() {
  const [sound, setSound] = React.useState<Sound>();

  async function playSound() {
    console.log("Loading Sound");
    const { sound } = await Audio.Sound.createAsync({
      uri: "https://cdns-preview-5.dzcdn.net/stream/c-5503df16eade59c9031bab1d4152c09f-11.mp3",
    });
    setSound(sound);

    console.log("Playing Sound");
    await sound.playAsync();
  }

  React.useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return <Button title="Play Sound" onPress={playSound} />;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 30,
    // alignItems: "center",
    // justifyContent: "center",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  margin: {
    margin: 4,
  },
});
