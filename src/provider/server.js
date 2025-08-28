import express from 'express';

// --- JSDoc: shared schemas ---------------------------------------------------
/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required: [id, name, email, active]
 *       properties:
 *         id:     { type: integer, example: 123 }
 *         name:   { type: string,  example: "Jane Doe" }
 *         email:  { type: string,  format: email, example: "jane.doe@example.com" }
 *         active: { type: boolean, example: true }
 *     Error:
 *       type: object
 *       required: [error]
 *       properties:
 *         error: { type: string, example: "Not found" }
 */

// -----------------------------------------------------------------------------
// Your existing app code (unchanged)
const app = express();

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// Example in-memory “db”
const USERS = {
  123: { id: 123, name: 'Jane Doe', email: 'jane.doe@example.com', active: true },
};

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *         description: User id
 *     responses:
 *       '200':
 *         description: Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '404':
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/users/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = USERS[id];
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

const PORT = Number(process.env.PORT || 9010);
app.listen(PORT, '127.0.0.1', () =>
  console.log(`Provider listening on http://127.0.0.1:${PORT}`)
);
