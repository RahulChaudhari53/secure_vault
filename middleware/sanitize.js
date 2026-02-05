const sanitize = (req, res, next) => {
    const clean = (obj) => {
        if (obj instanceof Object) {
            for (let key in obj) {
                if (key.startsWith('$')) {
                    console.warn(`[SECURITY] NoSQL Injection attempt detected and blocked: ${key}`);
                    delete obj[key];
                } else if (obj[key] instanceof Object) {
                    clean(obj[key]);
                }
            }
        }
    };

    if (req.body) clean(req.body);
    if (req.params) clean(req.params);
    
    next();
};

module.exports = sanitize;
