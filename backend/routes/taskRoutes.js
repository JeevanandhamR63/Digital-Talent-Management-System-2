const express = require('express');
const { createTask, getTasks, updateTask, deleteTask, updateTaskStatus, addTaskUpdate } = require('../controllers/taskController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, admin, createTask)
  .get(protect, getTasks);

router.route('/:id')
  .put(protect, admin, updateTask)
  .delete(protect, admin, deleteTask);

router.route('/:id/status')
  .patch(protect, updateTaskStatus);

router.route('/:id/updates')
  .post(protect, addTaskUpdate);

module.exports = router;
