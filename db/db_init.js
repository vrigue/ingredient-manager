// (Re)Sets up the database, including a little bit of sample data
const db = require("./db_connection");

/**** Delete existing table, if any ****/
const drop_ingredient_table_sql = "DROP TABLE IF EXISTS `ingredient`;"
db.execute(drop_ingredient_table_sql);

/**** Create "ingredient" table (again)  ****/
const create_ingredient_table_sql = `
    CREATE TABLE ingredient (
        id INT NOT NULL AUTO_INCREMENT,
        item VARCHAR(45) NOT NULL,
        quantity INT NOT NULL,
        purchaseQuantity INT NOT NULL,
        PRIMARY KEY (id)
    );
`
db.execute(create_ingredient_table_sql);

/**** Create some sample items ****/

const insert_ingredient_table_sql = `
    INSERT INTO ingredient 
        (item, quantity, purchaseQuantity) 
    VALUES 
        (?, ?, ?);
`
db.execute(insert_ingredient_table_sql, ['Dark Brown Sugar', '2', '4']);

db.execute(insert_ingredient_table_sql, ['Bread Flour', '0', '6']);

db.execute(insert_ingredient_table_sql, ['White Sugar', '12', '0']);

db.execute(insert_ingredient_table_sql, ['Ube Powder', '4', '2']);

/**** Read the sample items inserted ****/

const read_ingredient_table_sql = "SELECT * FROM ingredient";

db.execute(read_ingredient_table_sql, 
    (error, results) => {
        if (error) 
            throw error;

        console.log("Table 'ingredient' initialized with:")
        console.log(results);
    }
);

db.end();