class User {
    constructor(database) {
        this.db = database;
    }

    createTable() {
        const sql = 'CREATE TABLE IF NOT EXISTS users (' +
            'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
            'username TEXT,' +
            'email TEXT,' +
            'password TEXT)';
        return this.db.run(sql);
    }

    create(username, email, password) {
        const sql = 'INSERT INTO users(username, email, password) SELECT ?, ?, ? WHERE NOT EXISTS(SELECT 1 FROM users WHERE username = ?)';
        return this.db.run(sql, [username, email, password, username]);
    }

    update(user) {
        const {id, username, email, password} = user;
        const sql = 'UPDATE users SET username = ? AND email = ? AND password = ? WHERE id = ?';
        return this.db.run(sql, [username, email, password, id]);
    }

    delete(id) {
        const sql = 'DELETE FROM users WHERE id = ?';
        return this.db.run(sql, [id]);
    }

    getById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        return this.db.get(sql, [id]);
    }

    getByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        return this.db.get(sql, [username]);
    }

    getByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        return this.db.get(sql, [email]);
    }

    getAll() {
        const sql = 'SELECT * FROM users';
        return this.db.all(sql);
    }
}

module.exports = User;