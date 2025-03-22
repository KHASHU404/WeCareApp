import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type HomeCardProps = {
  title: string;
  iconName: string;
  backgroundColor: string;
  onPress: () => void;
};

const HomeCard: React.FC<HomeCardProps> = ({ title, iconName, backgroundColor }) => {
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor }]} >
      <MaterialIcons name={iconName} size={40} color="#fff" />
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: Dimensions.get('window').width * 0.4,
    height: 150,
    borderRadius: 10,
    margin: 10,
    alignItems:'flex-start',
    justifyContent: 'flex-start',
    padding: 10,
  },
  cardTitle: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeCard;
