const mongoose = require('mongoose');
const MealTiming = require('../models/MealTiming');

async function initializeMealTimings() {
  try {
    // Clear existing meal timings
    await MealTiming.deleteMany({});
    
    // Create meal timings as per requirements
    const mealTimings = [
      {
        mealType: 'breakfast',
        cutoffTime: '07:00', // Students must mark before 7 AM
        mealStartTime: '08:00', // Breakfast starts at 8 AM
        mealEndTime: '09:00',   // Breakfast ends at 9 AM
      },
      {
        mealType: 'lunch',
        cutoffTime: '11:00', // Students must mark before 11 AM
        mealStartTime: '12:00', // Lunch starts at 12 PM
        mealEndTime: '14:00',   // Lunch ends at 2 PM
      },
      {
        mealType: 'dinner',
        cutoffTime: '18:00', // Students must mark before 6 PM
        mealStartTime: '19:00', // Dinner starts at 7 PM
        mealEndTime: '21:00',   // Dinner ends at 9 PM
      }
    ];

    await MealTiming.insertMany(mealTimings);
    console.log('Meal timings initialized successfully');
    console.log('Breakfast: Mark before 7:00 AM (8:00-9:00 serving)');
    console.log('Lunch: Mark before 11:00 AM (12:00-14:00 serving)');
    console.log('Dinner: Mark before 6:00 PM (19:00-21:00 serving)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing meal timings:', error);
    process.exit(1);
  }
}

initializeMealTimings();
