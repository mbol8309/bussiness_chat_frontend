import { useCallback } from "react"

const useStopPropagation = (method=null) => {
    const callback = useCallback((event) => {
        event.stopPropagation()
        method && method(event)
    }, [method]);

    return callback
}

export {
    useStopPropagation
};