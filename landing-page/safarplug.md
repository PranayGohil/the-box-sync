# ChargeMate — Full Antigravity Build Prompts
## EV Charging Station App for India (Car + Bike)
### Paste each prompt into Antigravity Agent mode one at a time.

---

## PROMPT 1 — Project Setup & Architecture

```
Create a new Flutter project named 'chargemate' in the current directory.

Use clean architecture with the following folder structure:

lib/
├── main.dart
├── app.dart
├── core/
│   ├── constants/
│   │   ├── app_colors.dart
│   │   ├── app_strings.dart
│   │   └── app_theme.dart
│   ├── utils/
│   │   ├── location_utils.dart
│   │   └── distance_utils.dart
│   └── widgets/
│       ├── custom_button.dart
│       ├── custom_text_field.dart
│       └── loading_widget.dart
├── models/
│   ├── user_model.dart
│   ├── station_model.dart
│   ├── charger_model.dart
│   ├── session_model.dart
│   └── trip_model.dart
├── services/
│   ├── auth_service.dart
│   ├── station_service.dart
│   ├── location_service.dart
│   ├── maps_service.dart
│   ├── session_service.dart
│   └── payment_service.dart
├── providers/
│   ├── auth_provider.dart
│   ├── station_provider.dart
│   ├── trip_provider.dart
│   └── session_provider.dart
├── screens/
│   ├── splash/
│   │   └── splash_screen.dart
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   ├── home/
│   │   ├── home_screen.dart
│   │   └── widgets/
│   │       ├── station_bottom_sheet.dart
│   │       ├── filter_chip_row.dart
│   │       └── nearby_station_card.dart
│   ├── station_detail/
│   │   ├── station_detail_screen.dart
│   │   └── widgets/
│   │       ├── charger_slot_grid.dart
│   │       └── review_card.dart
│   ├── trip_planner/
│   │   ├── trip_planner_screen.dart
│   │   └── widgets/
│   │       ├── route_stop_list.dart
│   │       └── battery_slider.dart
│   ├── session/
│   │   └── charging_session_screen.dart
│   ├── owner/
│   │   ├── register_station_screen.dart
│   │   ├── owner_dashboard_screen.dart
│   │   └── widgets/
│   │       ├── charger_toggle_row.dart
│   │       └── session_activity_row.dart
│   └── profile/
│       └── profile_screen.dart
└── router/
    └── app_router.dart

Add these dependencies to pubspec.yaml:
- flutter_riverpod: ^2.5.1 (state management)
- go_router: ^14.0.0 (navigation)
- google_maps_flutter: ^2.6.1 (maps)
- geolocator: ^12.0.0 (GPS location)
- firebase_core: ^3.3.0
- firebase_auth: ^5.1.4
- cloud_firestore: ^5.2.1
- firebase_storage: ^12.1.2
- razorpay_flutter: ^1.3.7 (payments)
- dio: ^5.4.3 (HTTP client)
- cached_network_image: ^3.3.1
- flutter_polyline_points: ^2.0.1 (route drawing)
- image_picker: ^1.1.2 (station photos)
- shared_preferences: ^2.3.1
- google_fonts: ^6.2.1
- permission_handler: ^11.3.1
- intl: ^0.19.0
- uuid: ^4.4.0

App theme: Green (#1D9E75) primary color, white backgrounds, clean Material 3 design.
App name: ChargeMate
```

---

## PROMPT 2 — Data Models

```
Create all data models in lib/models/ with full Firestore serialization (fromJson, toJson):

1. lib/models/user_model.dart
Fields: id, name, email, phone, profilePicUrl, userType (enum: ev_user | station_owner), vehicleType (enum: car | bike | both), createdAt

2. lib/models/station_model.dart
Fields: id, ownerId, name, address, latitude, longitude, description, photoUrls (List<String>), chargerTypes (List<ChargerType>), pricePerKwh (double), workingHoursStart, workingHoursEnd, isVerified (bool), isActive (bool), rating (double), totalReviews (int), totalSlotsAvailable (int), createdAt

3. lib/models/charger_model.dart
Fields: id, stationId, chargerType (enum: ac_slow_2w | ac_slow_car | ac_fast_car | dc_fast_car), powerKw (double), connectorType (enum: type2 | ccs2 | home_plug), isAvailable (bool), vehicleCompatibility (List<String>: ['car', 'bike'])

4. lib/models/session_model.dart
Fields: id, userId, stationId, chargerId, startTime, endTime, startBatteryPercent, endBatteryPercent, energyUsedKwh, totalCostRs, paymentStatus (enum: pending | paid | failed), vehicleType, razorpayPaymentId

5. lib/models/trip_model.dart
Fields: id, userId, fromLocation (LatLng), toLocation (LatLng), fromName, toName, vehicleType, startBatteryPercent, vehicleRangeKm, selectedStops (List<StationModel>), estimatedDistanceKm, createdAt

6. lib/models/review_model.dart
Fields: id, stationId, userId, userName, rating (double), comment, createdAt
```

---

## PROMPT 3 — Firebase Services

```
Create Firebase service files:

1. lib/services/auth_service.dart
Implement:
- signUpWithEmail(name, email, password, phone, userType)
- signInWithEmail(email, password)
- signInWithGoogle()
- signOut()
- getCurrentUser()
- updateUserProfile(UserModel)
Store user data in Firestore 'users' collection on signup.

2. lib/services/station_service.dart
Implement with Firestore:
- getNearbyStations(latitude, longitude, radiusKm, {vehicleFilter})
  Use Firestore GeoPoint queries, filter by distance in Dart.
- getStationById(stationId)
- getStationsByOwner(ownerId)
- registerStation(StationModel) → saves to 'stations' collection
- updateStationAvailability(stationId, isActive)
- addReview(ReviewModel)
- getReviews(stationId)
- searchStations(query)

3. lib/services/session_service.dart
Implement:
- startSession(userId, stationId, chargerId, startBattery, vehicleType) → creates session in Firestore, marks charger as unavailable
- updateSessionProgress(sessionId, currentBatteryPercent, energyUsed)
- endSession(sessionId, endBattery, energyUsed) → calculates cost, marks charger available
- getSessionHistory(userId)
- getOwnerSessions(ownerId, {date})

4. lib/services/location_service.dart
Implement:
- getCurrentLocation() → returns Position
- requestLocationPermission()
- getAddressFromLatLng(lat, lng) → reverse geocode using Google Maps Geocoding API
- getLatLngFromAddress(address) → forward geocode

5. lib/services/maps_service.dart
Implement:
- getDirections(origin LatLng, destination LatLng) → returns polyline points and distance
- calculateRoute(from, to, stops List<LatLng>) → returns full route with distance between each segment
- suggestChargingStops(from, to, batteryPercent, vehicleRangeKm, availableStations) → algorithm:
  * Calculate total route distance
  * Based on current battery and vehicle range, find how far the vehicle can go
  * Find nearest station along route within that range
  * Repeat until destination is reachable
  * Return ordered list of StationModel stops with estimated arrival battery %
```

---

## PROMPT 4 — State Management (Riverpod Providers)

```
Create Riverpod providers in lib/providers/:

1. lib/providers/auth_provider.dart
- authStateProvider: StreamProvider watching Firebase auth state
- currentUserProvider: FutureProvider fetching UserModel from Firestore
- authNotifierProvider: StateNotifier with login, register, logout methods

2. lib/providers/station_provider.dart
- nearbyStationsProvider: FutureProvider(lat, lng, filter) → List<StationModel>
- selectedStationProvider: StateProvider<StationModel?>
- vehicleFilterProvider: StateProvider<String> (default: 'all')
- searchRadiusProvider: StateProvider<double> (default: 5.0 km)
- stationDetailProvider: FutureProvider(stationId) → StationModel

3. lib/providers/trip_provider.dart
- tripStateProvider: StateNotifier with:
  * fromLocation, toLocation
  * vehicleType, batteryPercent
  * suggestedStops List<StationModel>
  * routePolyline
  * calculateTrip() → calls MapsService.suggestChargingStops
  * clearTrip()

4. lib/providers/session_provider.dart
- activeSessionProvider: StreamProvider watching current active session
- sessionTimerProvider: StreamProvider emitting elapsed seconds
- sessionCostProvider: Provider computing cost from energy used
```

---

## PROMPT 5 — Home Screen with Google Maps

```
Build lib/screens/home/home_screen.dart:

A full-screen Google Maps view with:

1. GoogleMap widget filling entire screen
  - Show user's current location with blue dot
  - Show custom green marker pins for each nearby station
  - Marker tap → show station bottom sheet
  - Camera auto-moves to user location on load

2. Top search bar (floating, rounded, white card)
  - Tap → open search/filter screen
  - Shows current city name

3. Filter chip row below search (horizontal scroll):
  - Chips: "All", "Bike 2W", "Car AC", "Car DC Fast"
  - Active chip highlighted green
  - Tapping chip filters map markers

4. Bottom sheet on marker tap (DraggableScrollableSheet):
  - Station name, address, distance, rating
  - Available/Busy status badge
  - Charger types (AC/DC/2W badges)
  - Price per kWh
  - "View Details" button → navigates to StationDetailScreen
  - "Navigate" button → opens Google Maps navigation

5. FAB bottom-right: current location button (re-center map)

6. Bottom navigation bar: Map | Trip | History | Profile

On screen load:
- Request location permission
- Get current GPS coordinates
- Load nearby stations from Firestore within 5km radius
- Plot markers on map
```

---

## PROMPT 6 — Station Detail Screen

```
Build lib/screens/station_detail/station_detail_screen.dart:

Receives StationModel as parameter via GoRouter.

Layout (scrollable):
1. Header map thumbnail (GoogleMap, non-interactive, 120px height, centered on station)
2. Station name, verified badge (if isVerified), address, distance
3. Quick info row: Open/Closed status, Working hours, Rating (stars + count), Price/kWh
4. "Charger Slots" section:
   - Grid of ChargerSlotCard widgets (2 per row)
   - Each card shows: slot name, power (kW), connector type, vehicle type
   - Color: green if available, red if occupied
   - Tapping available slot pre-selects it for booking

5. "Compatible vehicles" badges row: Car / Bike icons

6. "Reviews" section:
   - Average rating with 5-star display
   - List of ReviewCard widgets: user avatar (initials), name, date, stars, comment
   - "Write a review" button (if user has completed a session here)

7. Sticky bottom bar:
   - Left: price display "₹12 / kWh"
   - Right: "Book a slot" green button
   - Tapping Book → shows slot selection bottom sheet → navigates to payment/session

Also build the charger slot selection bottom sheet:
- Title "Select a charger slot"
- List of available chargers with type, power, connector
- "Confirm booking" button → initiates Razorpay payment for ₹2 platform fee
- On payment success → navigate to ChargingSessionScreen
```

---

## PROMPT 7 — Trip Planner Screen

```
Build lib/screens/trip_planner/trip_planner_screen.dart:

Layout:

1. Route input section (white card):
   - "From" field with green dot: text input + GPS icon to use current location
   - "To" field with red dot: text input with autocomplete using Google Places API
   - Divider line connecting the two dots (like Google Maps)

2. Vehicle & battery section:
   - Vehicle type selector: two toggle buttons [Car] [Bike]
   - Battery level slider (0-100%) with battery icon
   - Label: "Current battery: 65%"
   - Vehicle range input (km): pre-filled based on common India EVs
     * Car default: 300km, Bike default: 120km

3. "Plan my trip" green button

4. On plan tap:
   - Show loading state "Finding best charging stops..."
   - Call tripProvider.calculateTrip()
   - Show route on embedded GoogleMap with:
     * Blue polyline for entire route
     * Green start pin, Red end pin
     * Blue station pins for suggested stops
   
5. "Suggested stops" section (after calculation):
   - Trip summary: total distance, estimated time, number of stops
   - Vertical timeline list showing:
     * Start point (green dot) — battery %, location name
     * Each charging stop (blue dot) — station name, distance from prev, arrive at X%, charge to Y%, ~Z min wait
     * Destination (red dot) — arrive at X% battery
   - Each stop row has "Change stop" button to swap for another nearby station

6. Dead zone warning banner (orange) if any segment has no stations available

7. "Start navigation" blue button → opens Google Maps with all waypoints
   "Save trip" option → stores in Firestore user's trips

Make the algorithm in tripProvider:
- Calculate segments based on battery range
- At each segment end, find closest station to the route (not just nearest to user)
- Account for charging time in ETA
```

---

## PROMPT 8 — Charging Session Screen

```
Build lib/screens/session/charging_session_screen.dart:

This screen shows while the vehicle is actively charging. Receives sessionId.

Layout:

1. Green header bar: "Charging in progress" + station name + slot name

2. Battery hero section (green background card):
   - Large battery percentage number (animated, updates live)
   - Subtitle: "was X% when started"
   - Animated progress bar (start% → target 80%)
   - Labels below: "X% start" on left, "80% target" on right

3. Live status badge:
   - Green pulsing dot + "Charging at X kW · ~Y min remaining"
   - Updates every 30 seconds via Firestore stream

4. Stats grid (2x2):
   - Time elapsed (counting up timer)
   - Energy used (kWh, incrementing)
   - Cost so far (₹, incrementing)
   - Estimated total (₹)

5. Session summary card:
   - Energy rate: ₹X/kWh
   - Platform fee: ₹2.00
   - Payment method: UPI · pre-paid
   - Separator line
   - Estimated total: ₹XX.XX (green, larger)

6. "Stop charging" red outlined button
   - Tap → confirmation dialog "Are you sure? Session will end and final amount will be settled"
   - On confirm → call sessionService.endSession(), navigate to session summary screen

7. Small note: "Payment auto-settled when session ends"

Session data streams from Firestore in real-time.
Timer uses sessionTimerProvider.
Cost computed from energyUsedKwh * pricePerKwh + platformFee.
```

---

## PROMPT 9 — Station Registration Screen (Owner)

```
Build lib/screens/owner/register_station_screen.dart:

This is for station owners to list their charging point. Only accessible if userType == station_owner.

Layout (scrollable form):

1. Header: "Register your station" with subtitle "List your charging point on ChargeMate"

2. Basic info section:
   - Station name (text field)
   - Description (multiline text field, optional)
   - Phone number for contact (pre-filled from user profile)

3. Location section:
   - "Pin your location on map" label
   - Embedded interactive GoogleMap (180px height)
   - User can tap anywhere on map to drop a pin
   - Below map: auto-filled address from reverse geocode
   - "Use my current location" button

4. Charger types section (multi-select grid):
   - Options:
     * AC Slow — 3.3 kW (2-Wheeler)
     * AC Slow — 7 kW (Car)
     * AC Fast — 22 kW (Car)
     * DC Fast — 50 kW (Car)
     * DC Ultra Fast — 150 kW (Car)
   - Each option is a toggle card with charger icon, name, power label
   - Green border + background when selected

5. Pricing section:
   - Price per kWh (₹) — number input
   - Different price for 2-wheeler (optional toggle, separate field)

6. Working hours:
   - Start time picker (default 6:00 AM)
   - End time picker (default 11:00 PM)
   - "Open 24 hours" toggle

7. Photos section:
   - "Add photos of your station" upload area
   - Tap → image_picker: pick up to 5 photos
   - Horizontal scroll of selected photo thumbnails with remove button
   - Photos upload to Firebase Storage

8. Amenities (optional checkboxes):
   - Parking available, Restroom nearby, Waiting area, Cafe/shop nearby

9. Submit button: "Submit for verification"
   - Validates all required fields
   - Saves to Firestore 'stations' collection with isVerified: false
   - Shows success dialog: "Your station has been submitted! Our team will verify and list it within 24 hours."
   - Navigates back to owner dashboard

Validation:
- Station name required
- At least one location pin required
- At least one charger type selected
- Price required
```

---

## PROMPT 10 — Owner Dashboard Screen

```
Build lib/screens/owner/owner_dashboard_screen.dart:

The station owner's control panel. Loads data for current owner's station(s).

Layout:

1. Header (green): "My station" + station name + today's date

2. Stats grid (2x2 metric cards):
   - Today's revenue (₹)
   - Sessions today (count)
   - Energy dispensed today (kWh)
   - Average rating (with star icon)

3. Weekly revenue bar chart:
   - Simple bar chart using fl_chart package (add it)
   - 7 bars for last 7 days, green color
   - Y-axis: revenue in ₹

4. "Charger status" section:
   - List of ChargerToggleRow widgets for each charger
   - Each row shows: charger name, power, vehicle type, status badge (Active/In Use/Offline)
   - Toggle switch on right to enable/disable charger
   - Toggle updates Firestore charger availability

5. "Recent sessions" section:
   - SessionActivityRow for each session (last 10)
   - Shows: vehicle type icon, vehicle/slot name, time, energy, duration, amount earned (+₹XX)
   - Tap row → session detail dialog

6. Payout section (bottom card):
   - "Available balance: ₹X,XXX"
   - Bank account linked badge (if set up)
   - "Request payout" blue button → opens bank transfer flow

7. Bottom: "Edit station details" text button → navigate to edit version of register_station_screen

If owner has no station yet: show empty state with "Register your first station" button.
```

---

## PROMPT 11 — Navigation, Auth Flow & Routing

```
Build lib/router/app_router.dart using GoRouter:

Routes:
- /splash → SplashScreen (checks auth state, redirects)
- /login → LoginScreen
- /register → RegisterScreen (with userType selection: EV User or Station Owner)
- /home → HomeScreen (requires auth)
- /station/:stationId → StationDetailScreen
- /trip → TripPlannerScreen
- /session/:sessionId → ChargingSessionScreen
- /owner/register-station → RegisterStationScreen
- /owner/dashboard → OwnerDashboardScreen
- /profile → ProfileScreen
- /history → ChargingHistoryScreen (list of past sessions)

Auth guard: redirect unauthenticated users to /login.
After login: if userType == station_owner → /owner/dashboard, else → /home.

Build lib/screens/auth/login_screen.dart:
- Email + password fields
- "Sign in with Google" button
- "Don't have an account? Register" link
- Forgot password link

Build lib/screens/auth/register_screen.dart:
- Name, email, password, phone fields
- Vehicle type selector (Car / Bike / Both) — only for EV users
- User type selector at top: "I'm an EV owner" | "I'm a station owner"
- Terms & conditions checkbox
- Register button → calls authService.signUpWithEmail

Build lib/screens/splash/splash_screen.dart:
- ChargeMate logo + tagline "Charge anywhere, anytime"
- Check Firebase auth state
- Auto-redirect after 2 seconds
```

---

## PROMPT 12 — Polish, Theme & Final Integration

```
Complete the following to finalize the app:

1. lib/core/constants/app_theme.dart
Create MaterialTheme with:
- Primary: #1D9E75 (teal green)
- Secondary: #378ADD (blue)
- Background: #FFFFFF
- Surface: #F5F5F5
- Error: #E24B4A
- Use Google Fonts: 'Nunito' for body, 'Nunito' semibold for headings
- Material 3 enabled
- Custom InputDecoration theme (rounded borders, green focus)
- Custom ElevatedButton theme (green, rounded, 48px height)

2. lib/core/widgets/custom_button.dart
Reusable green button with loading state (CircularProgressIndicator replaces text when loading: true)

3. lib/core/widgets/station_map_marker.dart
Custom map marker widget: green circle with bolt icon, showing available slot count badge

4. Add firebase_options.dart by running:
flutterfire configure
(for both Android and iOS)

5. lib/main.dart
- Initialize Firebase
- Wrap with ProviderScope (Riverpod)
- Set GoRouter as router
- Handle location permissions on startup

6. android/app/src/main/AndroidManifest.xml
Add:
- INTERNET permission
- ACCESS_FINE_LOCATION permission
- ACCESS_COARSE_LOCATION permission
- Google Maps API key meta-data

7. Create assets/
- assets/images/logo.png placeholder
- assets/icons/ folder
Update pubspec.yaml to include assets

8. Run dart analyze and fix all warnings.
Run flutter test to verify no broken imports.
Show me the final folder structure.
```

---

## PROMPT 13 — Firestore Security Rules

```
Create Firestore security rules for this app. Write the full rules file:

Collections:
- users: owner can read/write their own document
- stations: anyone can read; only station owner can write their own; admin can write isVerified
- chargers: anyone can read; only station owner can write
- sessions: user can read/write their own sessions; station owner can read sessions for their station
- reviews: anyone can read; authenticated user can write; user can only delete their own

Also create Firebase Storage rules:
- station_photos/: authenticated users can upload; anyone can read
- profile_photos/: user can upload their own; anyone can read

Write these as the actual rules file content that can be deployed with:
firebase deploy --only firestore:rules,storage
```

---

## PROMPT 14 — Testing

```
Write Flutter widget and unit tests:

1. test/models/station_model_test.dart
- Test fromJson and toJson serialization
- Test distance calculation helper

2. test/services/maps_service_test.dart
- Test suggestChargingStops algorithm
- Test case: 300km route, 65% battery, 250km range → expect 1 stop
- Test case: 600km route, 40% battery, 250km range → expect 2+ stops
- Test case: short 50km route, 80% battery, 250km range → expect 0 stops

3. test/providers/trip_provider_test.dart
- Test trip calculation state changes

4. integration_test/app_test.dart
- Test login flow
- Test station search
- Test trip planning end-to-end

Run all tests with: flutter test
Fix any failing tests.
```

---

## QUICK REFERENCE — Key API Keys Needed

After building, you need to set up:
| Service | Where to get |
|---|---|
| Google Maps SDK (Android) | console.cloud.google.com → Maps SDK for Android |
| Google Maps SDK (iOS) | console.cloud.google.com → Maps SDK for iOS |
| Google Places API | console.cloud.google.com → Places API |
| Google Directions API | console.cloud.google.com → Directions API |
| Firebase (all services) | console.firebase.google.com |
| Razorpay | dashboard.razorpay.com → API Keys |

---

## ORDER TO PASTE PROMPTS

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14

After each prompt, let Antigravity finish completely before pasting the next one.
If Antigravity asks to approve a terminal command (flutter pub get, etc.) — approve it.

