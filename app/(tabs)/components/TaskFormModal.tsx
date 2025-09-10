import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Task } from '../../_api/APIClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialData?: Task;
}

const TaskFormModal: React.FC<Props> = ({ visible, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setPriority(initialData.priority);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
    }
  }, [initialData, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title, description, priority });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.heading}>{initialData ? 'Edit Task' : 'New Task'}</Text>
          <TextInput placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} />
          <TextInput placeholder="Description" style={styles.input} value={description} onChangeText={setDescription} />
          <Picker selectedValue={priority} onValueChange={(v) => setPriority(v as any)} style={styles.picker}>
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
          </Picker>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TaskFormModal;

const styles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center' },
  container: { width:'90%', backgroundColor:'#fff', padding:20, borderRadius:12 },
  heading: { fontSize:18, fontWeight:'700', marginBottom:12 },
  input: { borderWidth:1, borderColor:'#ccc', padding:8, borderRadius:8, marginBottom:12 },
  picker: { marginBottom:12 },
  actions: { flexDirection:'row', justifyContent:'space-between' },
  saveBtn: { backgroundColor:'#007AFF', padding:10, borderRadius:8 },
  cancelBtn: { padding:10, borderRadius:8 }
});
