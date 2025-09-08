// Test script to verify EventModal functionality
// Run this in browser console to test event card clicks

console.log('🧪 Testing EventModal functionality...');

// Test function to simulate event card clicks
const testEventCardClicks = () => {
  const results = {
    eventMarket: false,
    upcomingEvents: false,
    goerExplore: false
  };

  // Test EventMarket cards
  const eventMarketCards = document.querySelectorAll('[data-testid="event-market-card"], .cursor-pointer:has([data-testid="event-title"])');
  if (eventMarketCards.length > 0) {
    console.log(`✅ Found ${eventMarketCards.length} EventMarket cards`);
    results.eventMarket = true;
  } else {
    console.log('❌ No EventMarket cards found');
  }

  // Test UpcomingEventsSection cards
  const upcomingEventCards = document.querySelectorAll('[data-testid="upcoming-event-card"], .cursor-pointer:has(.font-medium)');
  if (upcomingEventCards.length > 0) {
    console.log(`✅ Found ${upcomingEventCards.length} UpcomingEvents cards`);
    results.upcomingEvents = true;
  } else {
    console.log('❌ No UpcomingEvents cards found');
  }

  // Test GoerExploreSection cards
  const goerExploreCards = document.querySelectorAll('[data-testid="event-explore-card"]');
  if (goerExploreCards.length > 0) {
    console.log(`✅ Found ${goerExploreCards.length} GoerExplore event cards`);
    results.goerExplore = true;
  } else {
    console.log('❌ No GoerExplore event cards found');
  }

  return results;
};

// Test EventModal presence
const testEventModalPresence = () => {
  const modals = document.querySelectorAll('[role="dialog"]');
  console.log(`📋 Found ${modals.length} modal(s) in DOM`);
  
  return modals.length > 0;
};

// Simulate click on first event card found
const simulateEventCardClick = () => {
  const eventCards = document.querySelectorAll('.cursor-pointer');
  const eventCard = Array.from(eventCards).find(card => 
    card.textContent?.includes('arrangement') || 
    card.textContent?.includes('event') ||
    card.querySelector('.font-medium')
  );

  if (eventCard) {
    console.log('🖱️ Simulating click on event card...');
    eventCard.click();
    
    // Check if modal opened after a short delay
    setTimeout(() => {
      const openModal = document.querySelector('[role="dialog"][data-state="open"]');
      if (openModal) {
        console.log('✅ EventModal opened successfully!');
      } else {
        console.log('❌ EventModal did not open');
      }
    }, 500);
  } else {
    console.log('❌ No event cards found to click');
  }
};

// Run tests
console.log('🚀 Running EventModal tests...');
const cardResults = testEventCardClicks();
const modalPresent = testEventModalPresence();

console.log('\n📊 Test Results:');
console.log('EventMarket cards:', cardResults.eventMarket ? '✅' : '❌');
console.log('UpcomingEvents cards:', cardResults.upcomingEvents ? '✅' : '❌');
console.log('GoerExplore cards:', cardResults.goerExplore ? '✅' : '❌');
console.log('Modal components present:', modalPresent ? '✅' : '❌');

// Only simulate click if cards are found
if (cardResults.eventMarket || cardResults.upcomingEvents || cardResults.goerExplore) {
  console.log('\n🎯 Attempting to simulate event card click...');
  simulateEventCardClick();
} else {
  console.log('\n⚠️ No event cards found to test click functionality');
}

// Export for manual use
window.testEventModal = {
  testCards: testEventCardClicks,
  testModal: testEventModalPresence,
  simulateClick: simulateEventCardClick
};

console.log('\n💡 You can run individual tests with:');
console.log('- window.testEventModal.testCards()');
console.log('- window.testEventModal.testModal()');
console.log('- window.testEventModal.simulateClick()');