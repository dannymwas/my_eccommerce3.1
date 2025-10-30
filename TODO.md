# TODO: Fix Login UI and Clean Up Cart Code

## Tasks
- [x] Update static/login.js: Change redirect to "/", remove unused cart fetch code.
- [x] Update static/logout.js: Change redirect to "/", remove unused cart save code.
- [x] Update static/home.html: Change Home link to "/", and logout redirect to "/".
- [x] Update static/home.js: Remove unused localStorage cart code (mergeGuestCartIfNeeded, trySyncCartToServer, cart variable, etc.) to avoid confusion.
- [x] Fix JavaScript variable initialization error in home.js
- [x] Add CORS headers to app.js
- [ ] Test login flow: Login, check UI hides login/register, shows logout.
- [ ] Test add to cart: After login, add items, verify saved in DB.
- [ ] Test logout: Logout, check UI resets, verify DB cart persists.
- [ ] Verify DB: Check users table for login details, cart table for items.
