import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM appointments ORDER BY date, startTime');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Get appointments by date
router.get('/date/:date', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM appointments WHERE date = ? ORDER BY startTime', [req.params.date]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching appointments by date:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointments by therapist
router.get('/therapist/:therapistId', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM appointments WHERE therapistId = ? ORDER BY date, startTime', [req.params.therapistId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching appointments by therapist:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const { id, therapistId, patientId, date, startTime, endTime, status, sessionType, notes } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO appointments (id, therapistId, patientId, date, startTime, endTime, status, sessionType, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, therapistId, patientId, date, startTime, endTime, status, sessionType, notes || null]
    );
    
    res.status(201).json({ message: 'Appointment created successfully', id });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const { therapistId, patientId, date, startTime, endTime, status, sessionType, notes } = req.body;
    
    const [result] = await db.execute(
      'UPDATE appointments SET therapistId = ?, patientId = ?, date = ?, startTime = ?, endTime = ?, status = ?, sessionType = ?, notes = ? WHERE id = ?',
      [therapistId, patientId, date, startTime, endTime, status, sessionType, notes || null, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;