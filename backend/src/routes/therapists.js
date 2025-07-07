import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Get all therapists
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM therapists ORDER BY name');
    
    // Ensure availability is an object
    const therapists = rows.map(therapist => ({
      ...therapist,
      availability: typeof therapist.availability === 'string' 
        ? JSON.parse(therapist.availability)
        : therapist.availability
    }));
    
    res.json(therapists);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// Get therapist by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM therapists WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    const therapist = {
      ...rows[0],
      availability: JSON.parse(rows[0].availability)
    };
    
    res.json(therapist);
  } catch (error) {
    console.error('Error fetching therapist:', error);
    res.status(500).json({ error: 'Failed to fetch therapist' });
  }
});

// Create new therapist
router.post('/', async (req, res) => {
  try {
    const { id, name, specialization, phone, availability } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO therapists (id, name, specialization, phone, availability) VALUES (?, ?, ?, ?, ?)',
      [id, name, specialization, phone, JSON.stringify(availability)]
    );
    
    res.status(201).json({ message: 'Therapist created successfully', id });
  } catch (error) {
    console.error('Error creating therapist:', error);
    res.status(500).json({ error: 'Failed to create therapist' });
  }
});

// Update therapist
router.put('/:id', async (req, res) => {
  try {
    const { name, specialization, phone, availability } = req.body;
    
    const [result] = await db.execute(
      'UPDATE therapists SET name = ?, specialization = ?, phone = ?, availability = ? WHERE id = ?',
      [name, specialization, phone, JSON.stringify(availability), req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    res.json({ message: 'Therapist updated successfully' });
  } catch (error) {
    console.error('Error updating therapist:', error);
    res.status(500).json({ error: 'Failed to update therapist' });
  }
});

// Delete therapist
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM therapists WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    res.json({ message: 'Therapist deleted successfully' });
  } catch (error) {
    console.error('Error deleting therapist:', error);
    res.status(500).json({ error: 'Failed to delete therapist' });
  }
});

export default router;