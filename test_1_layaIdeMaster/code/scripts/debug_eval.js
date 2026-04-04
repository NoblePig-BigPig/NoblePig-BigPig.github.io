const cdp = require('./cdp-bridge');
const expr = process.argv[2];
(async function(){
    let conn;
    try {
        conn = await cdp.connect();
        const res = await conn.evaluate(expr);
        console.log(JSON.stringify(res, null, 2));
    } catch(e) {
        console.error(e.message);
    } finally {
        if(conn) conn.close();
    }
})();
