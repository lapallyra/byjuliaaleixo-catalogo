# Security Specification - Product Reviews

## 1. Data Invariants
- A review must be linked to a valid `productId`.
- A review must have a valid `rating` (1-5).
- A user can only post one review per product.
- Admin reply can only be added by an admin.

## 2. The "Dirty Dozen" Payloads
1.  `{productId: "1", userId: "u1", rating: 6, comment: "bad"}` - Invalid rating.
2.  `{productId: "1", userId: "u1", rating: 1, comment: "A".repeat(1001)}` - Comment too long.
3.  `{productId: "1", userId: "u1", rating: 1, comment: "good", adminReply: "Nice"}` - User trying to set adminReply.
4.  `{productId: "1", userId: "u1", rating: 1, comment: "good", ghostField: true}` - Ghost field.
5.  `{productId: "1", userId: "u2", rating: 1, comment: "good"}` - User trying to post as someone else.
6.  `{productId: "1", userId: "u1", rating: 1}` - Missing comment.
7.  `{productId: "1", userId: "u1", rating: "5", comment: "good"}` - Invalid rating type.
8.  `{productId: "invalid_id_with_special_chars!!", userId: "u1", rating: 1, comment: "good"}` - Invalid product ID.
9.  `{productId: "1", userId: "u1", rating: 1, comment: "good", createdAt: "2020-01-01"}` - Invalid timestamp.
10. `{productId: "1", userId: "u1", rating: 1, comment: "good"}` - Missing required field `userName`.
11. `{productId: "1", userId: "u1", rating: 1, comment: "good", rating: 1}` - Duplicate field.
12. `{}` - Empty payload.

## 3. Test Runner
(Will be implemented in `firestore.rules.test.ts`)
