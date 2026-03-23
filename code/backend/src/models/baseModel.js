class BaseModel {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  // 通用查询方法
  async findAll(where = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map((key) => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    return new Promise((resolve, reject) => {
      this.db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  async count(where = {}) {
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const params = [];

    if (Object.keys(where).length > 0) {
      const conditions = Object.keys(where).map((key) => {
        params.push(where[key]);
        return `${key} = ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row.total);
      });
    });
  }

  async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row || null);
        }
      );
    });
  }

  async create(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, Object.values(data), function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, ...data });
      });
    });
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const setClause = keys.map((key) => `${key} = ?`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, [...Object.values(data), id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ affectedRows: this.changes, id });
      });
    });
  }

  async delete(id) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ affectedRows: this.changes });
      });
    });
  }
}

module.exports = BaseModel;
