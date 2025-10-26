const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Path to holidays file
const HOLIDAYS_FILE = path.join(__dirname, '../data/holidays.json');

// Helper function to read holidays
async function readHolidays() {
  try {
    const data = await fs.readFile(HOLIDAYS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading holidays:', error);
    return { holidays: [] };
  }
}

// GET /api/holidays - Get all holidays
router.get('/', async (req, res) => {
  try {
    const data = await readHolidays();
    res.json(data);
  } catch (error) {
    console.error('Error getting holidays:', error);
    res.status(500).json({ error: 'Failed to get holidays' });
  }
});

// GET /api/holidays/upcoming - Get upcoming holidays
router.get('/upcoming', async (req, res) => {
  try {
    const data = await readHolidays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get limit from query param (default 5)
    const limit = parseInt(req.query.limit) || 5;
    
    // Filter and sort upcoming holidays
    const upcomingHolidays = data.holidays
      .filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= today;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit);
    
    res.json({ holidays: upcomingHolidays });
  } catch (error) {
    console.error('Error getting upcoming holidays:', error);
    res.status(500).json({ error: 'Failed to get upcoming holidays' });
  }
});

// GET /api/holidays/by-month/:year/:month - Get holidays by month
router.get('/by-month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const data = await readHolidays();
    
    const monthlyHolidays = data.holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getFullYear() === parseInt(year) && 
             (holidayDate.getMonth() + 1) === parseInt(month);
    });
    
    res.json({ holidays: monthlyHolidays });
  } catch (error) {
    console.error('Error getting monthly holidays:', error);
    res.status(500).json({ error: 'Failed to get monthly holidays' });
  }
});

// GET /api/holidays/by-type/:type - Get holidays by type
router.get('/by-type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const data = await readHolidays();
    
    const filteredHolidays = data.holidays.filter(holiday => 
      holiday.type === type
    );
    
    res.json({ holidays: filteredHolidays });
  } catch (error) {
    console.error('Error getting holidays by type:', error);
    res.status(500).json({ error: 'Failed to get holidays by type' });
  }
});

// POST /api/holidays - Create a new holiday
router.post('/', async (req, res) => {
  try {
    const { name, date, type, country, description } = req.body;
    
    // Validate required fields
    if (!name || !date || !type) {
      return res.status(400).json({ error: 'Name, date, and type are required' });
    }
    
    const data = await readHolidays();
    
    // Generate new ID
    const maxId = data.holidays.length > 0 
      ? Math.max(...data.holidays.map(h => parseInt(h.id))) 
      : 0;
    const newId = (maxId + 1).toString();
    
    // Create new holiday
    const newHoliday = {
      id: newId,
      name,
      date,
      type,
      country: country || 'US',
      description: description || ''
    };
    
    data.holidays.push(newHoliday);
    
    // Sort by date
    data.holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Write back to file
    await fs.writeFile(HOLIDAYS_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    res.status(201).json({ holiday: newHoliday, message: 'Holiday created successfully' });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// PUT /api/holidays/:id - Update a holiday
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, type, country, description } = req.body;
    
    const data = await readHolidays();
    const holidayIndex = data.holidays.findIndex(h => h.id === id);
    
    if (holidayIndex === -1) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    // Update holiday
    data.holidays[holidayIndex] = {
      ...data.holidays[holidayIndex],
      name: name || data.holidays[holidayIndex].name,
      date: date || data.holidays[holidayIndex].date,
      type: type || data.holidays[holidayIndex].type,
      country: country || data.holidays[holidayIndex].country,
      description: description !== undefined ? description : data.holidays[holidayIndex].description
    };
    
    // Sort by date
    data.holidays.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Write back to file
    await fs.writeFile(HOLIDAYS_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    res.json({ holiday: data.holidays[holidayIndex], message: 'Holiday updated successfully' });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

// DELETE /api/holidays/:id - Delete a holiday
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = await readHolidays();
    const holidayIndex = data.holidays.findIndex(h => h.id === id);
    
    if (holidayIndex === -1) {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    
    // Remove holiday
    const deletedHoliday = data.holidays.splice(holidayIndex, 1)[0];
    
    // Write back to file
    await fs.writeFile(HOLIDAYS_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    res.json({ holiday: deletedHoliday, message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

// Helper function to load fallback holidays from local file
async function loadFallbackHolidays(country, year) {
  const fallbackFile = path.join(__dirname, `../data/indian-holidays-${year}.json`);
  
  try {
    const data = await fs.readFile(fallbackFile, 'utf8');
    const fallbackData = JSON.parse(data);
    console.log(`Loaded ${fallbackData.holidays.length} holidays from fallback file`);
    return fallbackData.holidays;
  } catch (error) {
    console.error('No fallback data available:', error.message);
    return null;
  }
}

// Helper function to fetch holidays from external API
async function fetchHolidaysFromAPI(country, year) {
  try {
    // Using date.nager.at public API (no API key required)
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    
    console.log(`Fetching from URL: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Employee360-Dashboard/1.0'
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid API response format');
    }
    
    console.log(`Successfully fetched ${response.data.length} holidays from API`);
    return response.data;
    
  } catch (error) {
    console.error('API fetch failed, trying fallback data...');
    
    // Try fallback data for India
    if (country === 'IN') {
      const fallbackHolidays = await loadFallbackHolidays(country, year);
      if (fallbackHolidays) {
        return fallbackHolidays;
      }
    }
    
    // If no fallback or not India, throw error
    if (error.response) {
      throw new Error(`API returned error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Unable to connect to holiday API. Please check your internet connection.');
    } else {
      throw error;
    }
  }
}

// POST /api/holidays/fetch-online - Fetch holidays from online API
router.post('/fetch-online', async (req, res) => {
  try {
    const { country, year, replaceExisting } = req.body;
    
    // Validate inputs
    if (!country || !year) {
      return res.status(400).json({ error: 'Country and year are required' });
    }
    
    // Country code mapping
    const countryCodeMap = {
      'india': 'IN',
      'in': 'IN',
      'us': 'US',
      'usa': 'US',
      'uk': 'GB',
      'canada': 'CA',
      'australia': 'AU'
    };
    
    const countryCode = countryCodeMap[country.toLowerCase()] || country.toUpperCase();
    
    console.log(`Fetching holidays for ${countryCode} in ${year}...`);
    
    // Fetch holidays from API
    const apiHolidays = await fetchHolidaysFromAPI(countryCode, year);
    
    if (!apiHolidays || apiHolidays.length === 0) {
      return res.status(404).json({ error: 'No holidays found for the specified country and year' });
    }
    
    // Read existing holidays
    const data = await readHolidays();
    let existingHolidays = data.holidays || [];
    
    // If replaceExisting is true, remove existing holidays for that country and year
    if (replaceExisting) {
      existingHolidays = existingHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return !(holiday.country === countryCode && holidayDate.getFullYear() === parseInt(year));
      });
    }
    
    // Get the maximum existing ID
    const maxId = existingHolidays.length > 0 
      ? Math.max(...existingHolidays.map(h => parseInt(h.id) || 0)) 
      : 0;
    
    // Transform API holidays to our format
    let nextId = maxId + 1;
    const newHolidays = apiHolidays.map(holiday => ({
      id: (nextId++).toString(),
      name: holiday.name || holiday.localName,
      date: holiday.date,
      type: holiday.types && holiday.types.includes('Public') ? 'public' : 
            holiday.global ? 'public' : 'cultural',
      country: countryCode,
      description: holiday.localName !== holiday.name ? holiday.localName : ''
    }));
    
    // Combine and sort holidays
    const allHolidays = [...existingHolidays, ...newHolidays];
    allHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Write back to file
    await fs.writeFile(
      HOLIDAYS_FILE, 
      JSON.stringify({ holidays: allHolidays }, null, 2), 
      'utf8'
    );
    
    res.json({ 
      message: `Successfully imported ${newHolidays.length} holidays for ${countryCode} ${year}`,
      imported: newHolidays.length,
      total: allHolidays.length,
      holidays: newHolidays
    });
  } catch (error) {
    console.error('Error fetching holidays from API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch holidays from online source',
      details: error.message 
    });
  }
});

module.exports = router;
