import React from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Task } from '../../_api/APIClient';
import TaskItem from '../components/TaskItem';

interface Props {
  route: any;
  navigation: any;
}

const SubTaskScreen: React.FC<Props> = ({ route, navigation }) => {
  const { task } = route.params;

  const handleTaskPress = (subtask: Task) => {
    if (subtask.subtasks && subtask.subtasks.length > 0) {
      navigation.push('SubTaskScreen', { task: subtask });
    }
  };

  const handleDelete = (taskId: number) => {
    // In a real app, you'd want to call your API and then navigate back
    // For now, just navigate back
    console.log('Delete task:', taskId);
    // You might want to implement this with a callback to parent or context update
  };

  const handleUpdate = (taskToUpdate: Task) => {
    // In a real app, you'd want to open edit modal
    console.log('Update task:', taskToUpdate);
  };

  const handleComplete = (taskId: number) => {
    // In a real app, you'd want to call your API
    console.log('Complete task:', taskId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{task.title}</Text>
        {task.description && (
          <Text style={styles.headerDesc}>{task.description}</Text>
        )}
        {task.completion_percentage !== undefined && (
          <Text style={styles.progressText}>
            Progress: {task.completion_percentage}% ({task.completed_subtask_count}/{task.subtask_count} completed)
          </Text>
        )}
      </View>

      {/* Subtasks list */}
      {task.subtasks && task.subtasks.length > 0 ? (
        <FlatList
          data={task.subtasks}
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
        />
      ) : (
        <View style={styles.noSubtasks}>
          <Text style={styles.noSubtasksText}>No subtasks</Text>
        </View>
      )}
    </View>
  );
};

export default SubTaskScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 12, 
    backgroundColor: '#f0f2f5' 
  },

  headerContainer: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
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

  noSubtasks: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20 
  },
  noSubtasksText: { 
    fontSize: 16, 
    color: '#555' 
  },
});