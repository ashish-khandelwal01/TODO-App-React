import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import APIClient, { Task } from '../../_api/APIClient';
import TaskItem from '../components/TaskItem';
import TaskFormModal from '../components/TaskFormModal';

interface Props {
  route: any;
  navigation: any;
}

const SubTaskScreen: React.FC<Props> = ({ route, navigation }) => {
  const { task: initialTask } = route.params;
  console.log('Initial task received:', initialTask);
  
  const [task, setTask] = useState<Task>(initialTask);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  // Fetch subtasks from API
  const fetchSubtasks = async () => {
    try {
      console.log('Fetching subtasks for task ID:', task.id);
      setLoading(true);
      
      // Call the new subtasks endpoint
      const response = await APIClient.getSubTasks(task.id);
      
      if (response.success) {
        setSubtasks(response.subtasks || []);
        console.log(`Loaded ${response.subtasks?.length || 0} subtasks for task ${task.id}`);
      } else {
        console.error('Failed to fetch subtasks:', response.error);
        setSubtasks([]);
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      setSubtasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch subtasks when component mounts
  useEffect(() => {
    fetchSubtasks();
  }, [task.id]);

  useEffect(() => {
    // Set up navigation header
    navigation.setOptions({
      title: task.title,
      headerBackTitle: 'Back'
    });
  }, [navigation, task.title]);

  const handleTaskPress = (subtask: Task) => {
    // Always navigate to subtask screen, let it handle loading its own subtasks
    navigation.push('SubTaskScreen', { task: subtask });
  };

  const handleDelete = async (taskId: number) => {
    try {
      await APIClient.deleteTask(taskId);
      await fetchSubtasks(); // Refresh subtasks
    } catch (e) {
      console.error('Error deleting task:', e);
    }
  };

  const handleComplete = async (taskId: number) => {
    try {
      await APIClient.completeTask(taskId);
      await fetchSubtasks(); // Refresh subtasks
    } catch (e) {
      console.error('Error completing task:', e);
    }
  };

  const handleUpdate = (taskToUpdate: Task) => {
    setEditingTask(taskToUpdate);
    setModalVisible(true);
  };

  const handleSave = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        console.log('Updating subtask:', editingTask.id, taskData);
        await APIClient.updateTask(editingTask.id, taskData);
        await fetchSubtasks(); // Refresh subtasks
        setModalVisible(false);
        setEditingTask(undefined);
      }
    } catch (e) {
      console.error('Error updating task:', e);
    }
  };

  const handleAddSubtask = () => {
    // Navigate back to TodoScreen or show modal to add subtask
    // You might want to implement this based on your app's flow
    console.log('Add subtask to:', task.id);
  };

  // Show loading spinner while fetching subtasks
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>{task.title}</Text>
          {task.description && (
            <Text style={styles.headerDesc}>{task.description}</Text>
          )}
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading subtasks...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{task.title}</Text>
        {task.description && (
          <Text style={styles.headerDesc}>{task.description}</Text>
        )}
        {subtasks.length > 0 && (
          <Text style={styles.progressText}>
            Subtasks: {subtasks.filter(t => t.completed).length}/{subtasks.length} completed
          </Text>
        )}
      </View>

      {/* Subtasks list */}
      {subtasks.length > 0 ? (
        <FlatList
          data={subtasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onComplete={handleComplete}
              onPress={() => handleTaskPress(item)}
              showSubtaskCount={true}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchSubtasks}
        />
      ) : (
        <View style={styles.noSubtasks}>
          <Text style={styles.noSubtasksText}>No subtasks</Text>
          <TouchableOpacity 
            style={styles.addSubtaskButton}
            onPress={handleAddSubtask}
          >
            <Text style={styles.addSubtaskText}>+ Add Subtask</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add subtask button for when there are existing subtasks */}
      {subtasks.length > 0 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddSubtask}
          >
            <Text style={styles.addButtonText}>+ Add Subtask</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Task Form Modal for editing */}
      <TaskFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(undefined);
        }}
        onSave={handleSave}
        initialData={editingTask}
      />
    </View>
  );
};

export default SubTaskScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f2f5' 
  },

  headerContainer: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerDesc: {
    fontSize: 14,
    color: '#e6f3ff',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#e6f3ff',
    textAlign: 'center',
    fontWeight: '500',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  noSubtasks: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 16,
  },
  noSubtasksText: { 
    fontSize: 16, 
    color: '#666',
    marginBottom: 20,
  },
  addSubtaskButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addSubtaskText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomContainer: {
    padding: 16,
    backgroundColor: '#f0f2f5',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 5,
    elevation: 5,
  },
  addButton: {
    backgroundColor: '#28A745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});