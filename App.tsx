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
    const [selectedArtist, setSelectedArtist] = useState<Artist>();

    return (
      <View style={styles.container}>
        <View>
          <TextInput
            style={styles.input}
            onChangeText={onChangeText}
            value={text}
          />
        </View>
        <View style={{ backgroundColor: "dodgerblue" }}>
          <ArtistChoices
            artistNameText={text}
            setSelectedArtist={(a) => {
              setSelectedArtist(a);
            }}
          />
        </View>
        <View style={{ backgroundColor: "#f0f0f0", height: 200 }}>
          <SongChoices selectedArtist={selectedArtist} />
        </View>
      </View>
    );
  }
}
type artistChoiceParam = {
  artistNameText: string;
  setSelectedArtist: (artist: Artist) => void;
};

function ArtistChoices(param: artistChoiceParam) {
  const [allArtists, setArtists] = useState<Artist[]>();
  useEffect(() => {
    GetArtists(param.artistNameText).then((a) => setArtists(a));
  }, [param.artistNameText]);

  return (
    <ScrollView style={{ height: 200 }}>
      {allArtists?.map((x) => (
        <TouchableHighlight
          key={x.id}
          onPress={() => param.setSelectedArtist(x)}
        >
          <Text style={styles.margin}>{x.name}</Text>
        </TouchableHighlight>
      ))}
    </ScrollView>
  );
}

type songChoiceParam = {
  selectedArtist: Artist | undefined;
};
function SongChoices(param: songChoiceParam) {
  const [choiceSongs, setChoiceSongs] = useState<Song[]>();
  const [solution, setSolution] = useState<Song>();
  const [allSongs, setAllSongs] = useState<Song[]>();

  useEffect(() => {
    if (param.selectedArtist != null) {
      GetSongs(param.selectedArtist).then((s) => setAllSongs(s));
    }
  }, [param.selectedArtist]);

  useEffect(() => {
    SetChoiceSongs();
  }, [allSongs]);

  useEffect(() => {
    setSolution(choiceSongs?.sort((a, b) => Math.random() - 0.5).slice(1)[0]);
  }, [choiceSongs]);

  useEffect(() => {
    let cancelSong: Promise<() => void> = new Promise((res) => res);
    if (solution != null) {
      cancelSong = PlaySong({ uri: solution.preview });
    }
    return () => {
      cancelSong.then((result) => result && result());
    };
  }, [solution]);

  async function SetChoiceSongs() {
    const length = allSongs?.length ?? 0;
    const randomOrdering = allSongs
      ?.sort((a, b) => Math.random() - 0.5)
      .slice(0, length > 4 ? 4 : length);
    setChoiceSongs(randomOrdering);
  }

  async function selectChoice(song: Song) {
    const message = song.id == solution?.id ? "Correct" : "Wrong";
    console.log(message);
    SetChoiceSongs();
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
  console.log("Loading Sound");
  const { sound } = await Audio.Sound.createAsync({
    uri: param.uri,
  });

  console.log("Playing Sound");
  await sound.playAsync();
  return () => {
    sound.unloadAsync();
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
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
