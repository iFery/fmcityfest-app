import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

const ArtistCard = ({ artist, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Image source={{ uri: artist.fields.photo_rectangle.url }} style={styles.backgroundImage} />
      <View style={styles.content}>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>{artist.fields.category_name}</Text>
        </View>
        <Text style={styles.name}>{artist.fields.name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    position: "relative",
    aspectRatio: 2.018,
    marginTop: 30,
    width: "100%",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 10,
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00000088",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12,
    textTransform: "uppercase",
    fontFamily: "Raleway",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Raleway",
    fontWeight: "600",
  },
});

export default ArtistCard;
