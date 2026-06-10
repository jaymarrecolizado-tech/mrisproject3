<?php
/**
 * DICT MRIS — Core Database Connection (PDO Singleton)
 */

class Database {
    private static ?Database $instance = null;
    private PDO $pdo;

    private function __construct() {
        $config = require __DIR__ . '/../config/database.php';
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['database'],
            $config['charset']
        );
        $this->pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection(): PDO {
        return $this->pdo;
    }

    public function query(string $sql, array $params = []): PDOStatement {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetchAll(string $sql, array $params = []): array {
        return $this->query($sql, $params)->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Paginated fetch: binds LIMIT and OFFSET as integers (PARAM_INT) to avoid
     * MySQL "LIMIT '5' OFFSET '0'" syntax error that occurs when integers are
     * passed through PDO emulation as strings.
     */
    public function paginate(string $sql, array $params, int $limit, int $offset): array {
        $stmt = $this->pdo->prepare($sql . ' LIMIT ? OFFSET ?');
        // Bind filter params positionally first
        foreach ($params as $i => $value) {
            $stmt->bindValue($i + 1, $value);
        }
        $stmt->bindValue(count($params) + 1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(count($params) + 2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function fetchOne(string $sql, array $params = []): array|false {
        return $this->query($sql, $params)->fetch();
    }

    public function fetchColumn(string $sql, array $params = []): mixed {
        return $this->query($sql, $params)->fetchColumn();
    }

    public function insert(string $table, array $data): int
    {
        foreach ($data as $k => $v) {
            if (is_array($v)) {
                $data[$k] = json_encode($v, JSON_UNESCAPED_UNICODE);
            }
        }
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $this->query($sql, $data);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(string $table, array $data, string $where, array $whereParams = []): int {
        $setParts = [];
        $allParams = [];
        foreach (array_keys($data) as $i => $col) {
            $paramName = "set_{$i}_{$col}";
            $setParts[] = "{$col} = :{$paramName}";
            $allParams[$paramName] = $data[$col];
        }
        $setClause = implode(', ', $setParts);

        // Convert positional ? placeholders in WHERE to named params
        $whereClause = $where;
        foreach ($whereParams as $i => $val) {
            $paramName = "where_{$i}";
            $whereClause = preg_replace('/\?/', ":{$paramName}", $whereClause, 1);
            $allParams[$paramName] = $val;
        }

        $sql = "UPDATE {$table} SET {$setClause} WHERE {$whereClause}";
        $stmt = $this->query($sql, $allParams);
        return $stmt->rowCount();
    }

    public function delete(string $table, string $where, array $params = []): int {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        return $this->query($sql, $params)->rowCount();
    }

    public function beginTransaction(): void {
        $this->pdo->beginTransaction();
    }

    public function commit(): void {
        $this->pdo->commit();
    }

    public function rollback(): void {
        $this->pdo->rollBack();
    }
}
