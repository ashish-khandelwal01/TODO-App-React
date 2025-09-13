import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import APIClient, { Task } from '../../_api/APIClient';
import TaskItem from '../components/TaskItem';
import TaskFormModal from '../components/TaskFormModal';
import SuggestedTasksModal from '../components/SuggestedTasksModal';
import ImportExportModal from '../components/ImportExportModal';
import { useAuth } from '../../_contexts/AuthContext';

interface Props {
  navigation: any;
}

const TodoScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestedModalVisible, setSuggestedModalVisible] = useState(false);
  const [importExportModalVisible, setImportExportModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await APIClient.getTasks();
      const parentTasks = (response.tasks || []).filter(task => !task.is_subtask);
      setTasks(parentTasks);
    } catch (e) {
      console.error('Fetch tasks error:', e);
      Alert.alert('Error', 'Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const handleSave = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        await APIClient.updateTask(editingTask.id, taskData);
      } else {
        await APIClient.createTask(
          taskData.title!,
          taskData.priority,
          taskData.parent_task_id,
          taskData.depth
        );
      }
      await fetchTasks();
      setModalVisible(false);
      setEditingTask(undefined);
    } catch (e) {
      console.error('Save task error:', e);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };

  const handleDelete = async (taskId: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This will also delete all subtasks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await APIClient.deleteTask(taskId);
              await fetchTasks();
            } catch (e) {
              console.error('Delete task error:', e);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleComplete = async (taskId: number) => {
    try {
      await APIClient.completeTask(taskId);
      await fetchTasks();
    } catch (e) {
      console.error('Complete task error:', e);
      Alert.alert('Error', 'Failed to complete task. Please try again.');
    }
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('SubTaskScreen', { task });
  };

  const handleImportComplete = () => {
    fetchTasks();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const renderPlaceholder = () => (
    <View style={styles.placeholder}>
      <View style={styles.placeholderTitle} />
      <View style={styles.placeholderDesc} />
    </View>
  );

  const HeaderComponent = () => (
    <LinearGradient
      colors={['#007AFF', '#005BBB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerContainer}
    >
    <TouchableOpacity
      style={styles.iconBtn}
      onPress={() => setImportExportModalVisible(true)}
      accessibilityLabel="Import/Export tasks"
    >
      <Text style={styles.iconText}>Import/Export</Text>
    </TouchableOpacity>

    <Text style={styles.headerTitle}>Todo List</Text>

    <TouchableOpacity
      style={styles.logoutBtn}
      onPress={handleLogout}
      accessibilityLabel="Logout"
    >
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
    </LinearGradient>
  );


  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>📝 No Tasks Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start organizing your day by creating your first task!
      </Text>
      <View style={styles.emptyActions}>
        <TouchableOpacity style={styles.emptyButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.emptyButtonText}>➕ Create Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.emptyButton, styles.emptyButtonSecondary]}
          onPress={() => setSuggestedModalVisible(true)}
        >
          <Text style={[styles.emptyButtonText, styles.emptyButtonTextSecondary]}>
            💡 Get Ideas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderComponent />
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={renderPlaceholder}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListHeaderComponent={<HeaderComponent />}
        ListEmptyComponent={<EmptyListComponent />}
        contentContainerStyle={[styles.listContent, tasks.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.suggestedBtn]}
            onPress={() => setSuggestedModalVisible(true)}
            accessibilityLabel="Get task suggestions"
          >
            <Text style={styles.actionBtnText}>💡 Suggestions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.addBtn]}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="Add new task"
          >
            <Text style={styles.actionBtnText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TaskFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(undefined);
        }}
        onSave={handleSave}
        initialData={editingTask}
      />

      <SuggestedTasksModal
        visible={suggestedModalVisible}
        onClose={() => {
          setSuggestedModalVisible(false);
          fetchTasks();
        }}
        onTaskSelected={() => {}}
      />

      <ImportExportModal
        visible={importExportModalVisible}
        onClose={() => setImportExportModalVisible(false)}
        onImportComplete={handleImportComplete}
      />
    </View>
  );
};

export default TodoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  iconBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Content area
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  emptyButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyButtonTextSecondary: {
    color: '#FFC107',
  },

  // Bottom buttons
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 5,
    elevation: 5,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  addBtn: {
    backgroundColor: '#28A745',
  },
  suggestedBtn: {
    backgroundColor: '#FFC107',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Placeholders
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
});
