import * as React from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  TextInput,
  ScrollView,
  TouchableHighlight,
  Alert,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import axios from "axios";
import { useEffect, useState } from "react";
import { ProgressBar, Colors } from "react-native-paper";

export default function App() {
  {
    const [text, onChangeText] = useState("disturbe");
    const [selectedArtist, setSelectedArtist] = useState<Artist | undefined>();

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
          <SongChoices
            selectedArtist={selectedArtist}
            setSelectedArtist={(a) => {
              setSelectedArtist(a);
            }}
          />
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
  setSelectedArtist: (artist: Artist | undefined) => void;
};
function SongChoices(param: songChoiceParam) {
  const [choiceSongs, setChoiceSongs] = useState<Song[]>();
  const [solution, setSolution] = useState<Song>();
  const [allSongs, setAllSongs] = useState<Song[]>();
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [percentageRemaining, setPercentageRemaining] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);

  useEffect(() => {
    if (param.selectedArtist != null) {
      GetSongs(param.selectedArtist).then((s) => setAllSongs(s));
    }
  }, [param.selectedArtist]);

  useEffect(() => {
    SetChoiceSongs();
    if (isGameStarted && allSongs && allSongs.length == 0) {
      let finalScorePercentage = score / 20000;
      let finalScoreMessage = " (";
      if (score < 0) {
        finalScoreMessage += "Do you really even know this band? ";
      } else {
        finalScoreMessage += finalScorePercentage * 100 + "%";
      }
      finalScoreMessage += ")";
      Alert.alert("Game Over", "Final Score: " + score + finalScoreMessage);
      setScore(0);
      param.setSelectedArtist(undefined);
      setIsGameStarted(false);
    }
  }, [allSongs]);

  useEffect(() => {
    if (choiceSongs == null) {
      return;
    }
    setIsGameStarted(true);
    setSolution(choiceSongs[Math.floor(Math.random() * choiceSongs.length)]);
  }, [choiceSongs]);

  useEffect(() => {
    let interval: NodeJS.Timer;
    let cancelSong: Promise<() => void> = new Promise((res) => res);
    if (solution != null) {
      cancelSong = PlaySong({ uri: solution.preview });
      interval = setInterval(() => {
        setTimeRemaining((seconds) => seconds - 1);
      }, 1000);
    }
    return () => {
      cancelSong.then((result) => result && result());
      setTimeRemaining(30);
      clearInterval(interval);
    };
  }, [solution]);

  useEffect(() => {
    setPercentageRemaining(timeRemaining / 30);
  }, [timeRemaining]);

  useEffect(() => {
    if (percentageRemaining == 0) {
      Alert.alert("Ran out of time", "Better luck in the next round...");
      SetChoiceSongs();
    }
  }, [percentageRemaining]);

  async function SetChoiceSongs() {
    const length = allSongs?.length ?? 0;
    const randomOrdering = allSongs
      ?.sort((a, b) => Math.random() - 0.5)
      .slice(0, length > 4 ? 4 : length);
    setChoiceSongs(randomOrdering);
  }

  async function selectChoice(song: Song) {
    const isCorrect = song.id == solution?.id;
    console.log(isCorrect);
    Alert.alert("", isCorrect ? "NICE!" : "You SUCK!", undefined, {
      cancelable: true,
    });
    if (isCorrect) {
      setAllSongs(allSongs?.filter((s) => s.id != solution.id));
      setScore(score + 1000);
    } else {
      SetChoiceSongs();
      setScore(score - 1000);
    }
  }
  return (
    <ScrollView style={{ height: 300 }}>
      <Text>{score}</Text>
      <View style={{ height: 50, flex: 1 }}>
        <ProgressBar
          progress={percentageRemaining}
          style={{ height: 50 }}
        ></ProgressBar>
      </View>
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
