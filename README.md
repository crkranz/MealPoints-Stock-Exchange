[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/7yqbrEZI)
# CSE330
Riva Kranz 508687 crkranz 
Michael Lerman 497967 mikeylerman

Creative Project Rubric

Rubric turned in on time (5 points)

Garrett Approved!

Languages / Frameworks Used (30 points)
- learned Learned/used react fronted (10 points)
- Learned/used express (node.js) backend (10 points)
- learned/used mongodb database (10 points)

Functionality (40 points)
- Users can register, login, and logout. (5 points)
- Logged in Users can place buy and sell orders (10 points)
- Orders are executed upon a match of buy and sell orders. (5 points)
- Users can DM each other to negotiate (10 points)
- Users can see market data, including trends in meal points price and previous transactions. (10 points)

Best Practices (5 points)
- code well formatted (2 points)
- HTML output passes validator (3 points)

Creative Portion (20 points)
- Integrated Socket.IO into both the backend and frontend to enable real-time updates and seamless communication across various features. This integration ensures that users receive live updates on order matches, new bids, current market values, and private messages. It also includes watchers for updates to users, orders, and matches, ensuring that all changes are promptly captured. Real-time chat functionality has been added, allowing users to communicate instantly.
- Implemented a private offer feature, allowing users to make direct offers on specific bids or asks. These offers are stored in the MongoDB offers collection and marked with statuses such as pending, accepted, or denied. Recipients can view and manage their offers through the "My Offers" page, deciding whether to accept or reject them. If an offer is accepted, the transaction is processed automatically, reflecting the updated meal points and account balances for both users.
