// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing tables, if any ****/
const drop_ingredient_table_sql = "DROP TABLE IF EXISTS `ingredient`;"
const drop_stock_table_sql = "DROP TABLE IF EXISTS `stock`;"

db.execute(drop_stock_table_sql);
db.execute(drop_ingredient_table_sql);

/**** Create "inventory" and "stock" tables (again)  ****/
const create_ingredient_table_sql = `
    CREATE TABLE ingredient (
        id INT NOT NULL AUTO_INCREMENT,
        item VARCHAR(45) NOT NULL,
        quantity INT NOT NULL,
        purchaseQuantity INT NOT NULL,
        description VARCHAR(1000) NULL,
        PRIMARY KEY (id)
    );
`

const create_stock_table_sql = `
    CREATE TABLE stock (
        id INT NOT NULL AUTO_INCREMENT,
        expiration_date VARCHAR(10) NOT NULL,
        brand_name VARCHAR(45) NOT NULL,
        price VARCHAR(45) NOT NULL,
        ingredient_id INT NOT NULL,
        PRIMARY KEY (id),
        INDEX ingredient_id_idx (ingredient_id ASC),
        CONSTRAINT ingredient_id
          FOREIGN KEY (ingredient_id)
          REFERENCES ingredient (id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
    );   
`
db.execute(create_ingredient_table_sql);
db.execute(create_stock_table_sql);


/**** Create some sample ingredients ****/
const insert_ingredient_table_sql = `
    INSERT INTO ingredient 
        (item, quantity, purchaseQuantity, description) 
    VALUES 
        (?, ?, ?, ?);
`
db.execute(insert_ingredient_table_sql, ['Dark Brown Sugar', '2', '3', 'Dark brown sugar has more molasses than light brown sugar, so your chocolate chip cookies and other baked goods will come out much darker in color.']);

db.execute(insert_ingredient_table_sql, ['Bread Flour', '2', '6', 'Bread flour has more gluten or protein than regular all-purpose flour.']);

db.execute(insert_ingredient_table_sql, ['White Sugar', '0', '5', 'White sugar is arguably the most used ingredient in baking.']);

db.execute(insert_ingredient_table_sql, ['Ube Powder', '4', '2', 'Great for making any ube dessert, especially ube cheese pandesal!']);


/**** Create some sample items ****/
const insert_stock_table_sql = `
    INSERT INTO stock 
        (expiration_date, brand_name, price, ingredient_id) 
    VALUES 
        (?, ?, ?, ?);
`

db.execute(insert_stock_table_sql, ['2023-02-28', 'Lidl', '1.75', '1']);
db.execute(insert_stock_table_sql, ['2023-04-15', 'Aldi', '1.25', '1']);

db.execute(insert_stock_table_sql, ['2024-01-26', 'White Lily', '2.50', '2']);
db.execute(insert_stock_table_sql, ['2025-05-17', 'King Arthur', '1.13', '2']);

db.execute(insert_stock_table_sql, ['2022-03-13', 'Giron Foods', '3.20', '4']);
db.execute(insert_stock_table_sql, ['2024-09-07', 'Giron Foods', '3.75', '4']);
db.execute(insert_stock_table_sql, ['2025-04-16', 'Pureblends', '5.75', '4']);
db.execute(insert_stock_table_sql, ['2025-12-08', 'Achievers', '4.99', '4']);


/**** Read the sample ingredients inserted ****/
const read_ingredient_table_sql = "SELECT * FROM ingredient";

db.execute(read_ingredient_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'ingredient' initialized with:")
        console.log(results);
    }
);

/**** Read the sample items inserted ****/
const read_stock_table_sql = "SELECT * FROM stock";

db.execute(read_stock_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'stock' initialized with:")
        console.log(results);
    }
);

db.end();