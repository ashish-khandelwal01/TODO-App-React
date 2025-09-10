import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import APIClient, { Task } from '../../_api/APIClient';
import TaskItem from '../components/TaskItem';
import TaskFormModal from '../components/TaskFormModal';
import { useAuth } from '../../_contexts/AuthContext';

interface Props {
  navigation: any;
}

const TodoScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await APIClient.getTasks();
      // Filter to show only parent tasks (depth = 0 or is_subtask = false)
      const parentTasks = (response.tasks || []).filter(task => !task.is_subtask);
      setTasks(parentTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSave = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        await APIClient.updateTask(editingTask.id, taskData);
      } else {
        await APIClient.createTask(
          taskData.title!,
          taskData.description,
          taskData.priority
        );
      }
      fetchTasks();
      setModalVisible(false);
      setEditingTask(undefined);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (taskId: number) => {
    await APIClient.deleteTask(taskId);
    fetchTasks();
  };

  const handleComplete = async (taskId: number) => {
    await APIClient.completeTask(taskId);
    fetchTasks();
  };

  const handleTaskPress = (task: Task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      navigation.navigate('SubTaskScreen', { task });
    }
  };

  const renderPlaceholder = () => (
    <View style={styles.placeholder}>
      <View style={styles.placeholderTitle} />
      <View style={styles.placeholderDesc} />
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={renderPlaceholder}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.header}>Todo List</Text>
            </View>
          }
        />
      ) : tasks.length === 0 ? (
        <View style={styles.noTasks}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Todo List</Text>
          </View>
          <Text style={styles.noTasksText}>No tasks yet</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onDelete={handleDelete}
              onUpdate={(t) => {
                setEditingTask(t);
                setModalVisible(true);
              }}
              onComplete={handleComplete}
              onPress={() => handleTaskPress(item)}
              showSubtaskCount={true}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTasks();
              }}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.header}>Todo List</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: '#fff' }}>+ Add Task</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={{ color: '#fff' }}>Logout</Text>
      </TouchableOpacity>

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

export default TodoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f0f2f5' },

  addBtn: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  logoutBtn: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
  },

  // Placeholder styles
  placeholder: {
    backgroundColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  placeholderTitle: {
    height: 16,
    width: '60%',
    backgroundColor: '#bbb',
    borderRadius: 6,
    marginBottom: 6,
  },
  placeholderDesc: {
    height: 12,
    width: '80%',
    backgroundColor: '#ccc',
    borderRadius: 6,
  },

  noTasks: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTasksText: {
    fontSize: 16,
    color: '#555',
    marginTop: 12,
  },

  // Header styling
  headerContainer: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});