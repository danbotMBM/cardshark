export function is_iterable(obj) {
    return obj != null && typeof obj[Symbol.iterator] === 'function';
}

export function do_recursive(obj, func){
    if (is_iterable(obj)){
        for (const elem of obj){
            do_recursive(elem, func);
        }
    }else{
        func(obj);
    }
}

export function do_recursive_till_true(obj, func){
    if (is_iterable(obj)){
        for (const elem of obj){
            if (do_recursive_till_true(elem, func)) break;
        }
    }else{
        func(obj);
    }
}