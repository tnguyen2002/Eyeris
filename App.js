
import {StyleSheet} from 'react-native';
import Eyeris from './components/Camera.js';


export default function App() {
  return (
    <Eyeris />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
