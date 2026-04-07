const Task = require('../models/Task');

const createTask = async (req, res) => {
  try {
    const { title, description, technicalRequirements, priority, dueDate, assignedTo } = req.body;
    
    const task = await Task.create({
      title,
      description,
      technicalRequirements,
      priority,
      dueDate,
      assignedTo,
      createdBy: req.user._id,
    });
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find({}).populate('assignedTo', 'name email').populate('createdBy', 'name email');
    } else {
      tasks = await Task.find({ assignedTo: req.user._id }).populate('createdBy', 'name email');
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, technicalRequirements, priority, dueDate, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (task) {
      task.title = title || task.title;
      task.description = description || task.description;
      task.technicalRequirements = technicalRequirements || task.technicalRequirements;
      task.priority = priority || task.priority;
      task.dueDate = dueDate || task.dueDate;
      task.assignedTo = assignedTo || task.assignedTo;

      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (task) {
      await task.deleteOne();
      res.json({ message: 'Task removed' });
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status, completedDate } = req.body;
    const task = await Task.findById(req.params.id);

    if (task) {
      // Allow only the assigned user or an admin to update
      if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized to update this task status' });
      }

      task.status = status || task.status;
      if (status === 'Completed' && completedDate) {
        task.completedDate = completedDate;
      } else if (status !== 'Completed') {
         // Reset completedDate if unmarked as completed
        task.completedDate = undefined;
      }

      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addTaskUpdate = async (req, res) => {
  try {
    const { date, stageCompleted } = req.body;
    const task = await Task.findById(req.params.id);

    if (task) {
      // Allow only the assigned user or an admin to add updates
      if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized to update this task' });
      }

      task.updates.push({ date, stageCompleted });
      const updatedTask = await task.save();
      res.json(updatedTask);
    } else {
      res.status(404).json({ message: 'Task not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addTaskUpdate,
};
