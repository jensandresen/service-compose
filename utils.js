exports.convertToArray = obj => {
    const result = new Array();
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const c = obj[key];
            c.id = key;
            result.push(c);
        }
    }
    return result;
}