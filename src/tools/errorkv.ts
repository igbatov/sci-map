export default (message:string, kv: Record<string, any>[]) => {
    return {
        message: message,
        kv: kv,
    }
}
