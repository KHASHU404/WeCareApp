import React from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity,Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons"

const HomeTab = ({ cards }) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1 }} >
      <View style={styles.container}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, {backgroundColor:(card.bgcolor || "red")} ]}
            onPress={() => navigation.navigate(card.screen)} // Navigate to the screen dynamically
          >
            <MaterialIcons name={card.icon} size={40} color='white'/>
            <Text style={styles.text}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop:20,
    flexWrap:'wrap',
    flexDirection:'row',
  },
  card: {
    height: Dimensions.get('window').width * 0.4,
    width: Dimensions.get('window').width * 0.4,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 10,
    marginLeft:20
  },
  text: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default HomeTab;
