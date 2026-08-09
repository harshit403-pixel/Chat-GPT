import { tool } from "langchain"
import {  contextDao } from "../../dao/context.dao.js"

import * as z from "zod"





export const getMemoryTool = tool(
    async ({ }, config) => {

        const userId = config.configurable.userId

        const context = await contextDao.readContextByUser({ userId })

        return context
    },
    {
        name: "getMemory",
        description: "Retrieves the context for a given user.",
        schema: z.object({}),
    }
)

export const updateMemoryTool = tool(
    async ({ description }: { description: string }, config) => {
        const userId = config.configurable.userId

        const result = await contextDao.updateContextByUser({ userId, description })

        return result
    },
    {
        name: "updateMemory",
        description: "Overrides or create new context for a given user.",
        schema: z.object({
            description: z.string().describe("The new context description for the user."),
        }),
    }
)
