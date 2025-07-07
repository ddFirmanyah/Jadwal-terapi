import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Get all patients
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM patients ORDER BY name');
    
    // Process patients data
    const patients = rows.map(patient => {
      const processed = {
        ...patient,
        referralData: patient.referral_data 
          ? (typeof patient.referral_data === 'string' 
              ? JSON.parse(patient.referral_data) 
              : patient.referral_data)
          : null
      };
      
      // Remove the raw referral_data field
      delete processed.referral_data;
      return processed;
    });
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by medical record number
router.get('/:mrn', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM patients WHERE medicalRecordNumber = ?', [req.params.mrn]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patient = {
      ...rows[0],
      referralData: rows[0].referral_data ? JSON.parse(rows[0].referral_data) : null
    };
    
    delete patient.referral_data;
    
    res.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const { medicalRecordNumber, name, contact, patientType, referralData } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO patients (medicalRecordNumber, name, contact, patientType, referral_data) VALUES (?, ?, ?, ?, ?)',
      [medicalRecordNumber, name, contact, patientType, referralData ? JSON.stringify(referralData) : null]
    );
    
    res.status(201).json({ message: 'Patient created successfully', medicalRecordNumber });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:mrn', async (req, res) => {
  try {
    const { name, contact, patientType, referralData } = req.body;
    
    const [result] = await db.execute(
      'UPDATE patients SET name = ?, contact = ?, patientType = ?, referral_data = ? WHERE medicalRecordNumber = ?',
      [name, contact, patientType, referralData ? JSON.stringify(referralData) : null, req.params.mrn]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Patient updated successfully' });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient
router.delete('/:mrn', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM patients WHERE medicalRecordNumber = ?', [req.params.mrn]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

export default router;