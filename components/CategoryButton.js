import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CategoryButton = ({ text, color, isActive, onPress }) => {
  return (
    <View style={[styles.button, { borderColor: color, backgroundColor: isActive ? color : 'transparent' }]}>
      <Text style={[styles.text, { color: isActive ? '#fff' : color }]} onPress={onPress}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "stretch",
    borderStyle: "solid",
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  text: {
    fontSize: 13,
    letterSpacing: 0.39,
    lineHeight: 26,
    textTransform: "uppercase",
    fontFamily: "Raleway",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default CategoryButton;
