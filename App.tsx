import * as React from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  TextInput,
  ScrollView,
  TouchableHighlight,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import axios from "axios";
import { useEffect, useState } from "react";

export default function App() {
  {
    const [text, onChangeText] = useState("red jumpsui");
    const [artists, setArtists] = useState<Artist[]>();
    const [allSongs, setAllSongs] = useState<Song[]>();
    const onChangeTextLog = async (t) => {
      onChangeText(t);
      setArtists(await GetArtists(t));
    };
    const selectArtist = async (artist: Artist) => {
      setAllSongs(await GetSongs(artist));
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
          <ScrollView style={{ height: 200 }}>
            {artists?.map((x) => (
              <TouchableHighlight key={x.id} onPress={() => selectArtist(x)}>
                <Text style={styles.margin}>{x.name}</Text>
              </TouchableHighlight>
            ))}
          </ScrollView>
        </View>
        <View style={{ backgroundColor: "#f0f0f0", height: 200 }}>
          <SongChoices songs={allSongs} />
        </View>
      </View>
    );
  }
}
type songChoiceParam = {
  songs: Song[] | undefined;
};
function SongChoices(param: songChoiceParam) {
  const [choiceSongs, setChoiceSongs] = useState<Song[]>();
  const [solution, setSolution] = useState<Song>();
  const [cancelSong, setCancelSong] = useState<() => void>();

  const randomizeSongs = async () => {
    const length = param.songs?.length ?? 0;
    const randomOrdering = param.songs
      ?.sort((a, b) => Math.random() - 0.5)
      .slice(0, length > 4 ? 4 : length);

    setChoiceSongs(randomOrdering);
    setSolution(choiceSongs?.sort((a, b) => Math.random() - 0.5).slice(1)[0]);
    console.log("solution: " + solution?.title);
    console.log("try cancel song: " + cancelSong);
    if (cancelSong != null) {
      cancelSong();
    }
    if (solution != null) {
      // setCancelSong(await PlaySong({ uri: solution.preview }));
      return await PlaySong({ uri: solution.preview });

      console.log("cancel song: " + cancelSong);
    }
  };
  const temp = useEffect(() => {
    const x = randomizeSongs();
    return () => {
      x.then((a) => a && a());
    };
  }, [param.songs]);
  console.log("temp: " + temp);

  async function selectChoice(song: Song) {
    const message = song.id == solution?.id ? "Correct" : "Wrong";
    console.log(message);
    randomizeSongs();
  }
  return (
    <ScrollView style={{ height: 200 }}>
      {choiceSongs?.map((x) => (
        <TouchableHighlight
          key={x.id}
          style={styles.margin}
          onPress={() => selectChoice(x)}
        >
          <Text> {x.title}</Text>
        </TouchableHighlight>
      ))}
    </ScrollView>
  );
}

type Artist = {
  id: string;
  name: string;
  picture_small: string;
};

type Song = {
  id: string;
  title: string;
  preview: string;
};

function GetSongs(parameter: Artist): Promise<Song[]> {
  return axios({
    method: "get",
    url: `https://api.deezer.com/artist/${parameter.id}/top?limit=20`,
    responseType: "json",
  }).then(function (response) {
    return response.data.data as Song[];
  });
}

function GetArtists(query: string): Promise<Artist[]> {
  return axios({
    method: "get",
    url: `https://api.deezer.com/search/artist/?q=${query}&limit=20`,
    responseType: "json",
  }).then(function (response) {
    return response.data.data as Artist[];
  });
}

type playSongParam = {
  uri: string;
};
async function PlaySong(param: playSongParam) {
  //const [sound, setSound] = React.useState<Sound>();

  //async function playSound() {
  console.log("Loading Sound");
  const { sound } = await Audio.Sound.createAsync({
    uri: param.uri,
  });

  console.log("Playing Sound");
  await sound.playAsync();
  return () => {
    sound.unloadAsync();
  };
  //  }

  // React.useEffect(() => {
  //   return sound
  //     ? () => {
  //         console.log("Unloading Sound");
  //         sound.unloadAsync();
  //       }
  //     : undefined;
  // }, [sound]);

  // playSound();
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
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
