import { tavily} from '@tavily/core'
import { env } from '../config/env.js'


const tvly = tavily({apiKey:env.tavilyApiKey})


export async function getResultFromWeb({query}:{query:string}):Promise<string> {

    const result = await tvly.search(query,{
        maxResults:20,
        includeAnswer:true
    })

    return result.answer || "no answer found for the query"
    
}