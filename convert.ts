let base64Img = require('base64-img');
let fs = require('fs');



fs.readdir('images/', function(err, items) {
    console.log(items);
    let data = [];

    for (let i=0; i<items.length; i++) {
        data.push(base64Img.base64Sync('images/' + items[i]));
        console.log(items[i]);
    }

    fs.writeFileSync('images.json', JSON.stringify(data));
});

