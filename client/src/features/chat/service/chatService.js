import { getAccessToken, httpClient } from '../../../shared/service/httpClient'

export const chatService = {
  // Fetch all conversations for the logged-in user
  listConversations() {
    return httpClient.get('/chat/conversations')
  },

  // Fetch a single conversation along with all its messages
  getConversation(conversationId) {
    return httpClient.get(`/chat/conversations/${conversationId}`)
  },

  // Send a message to the backend and receive the AI response as a stream
  async sendMessageStream(message, conversationId, { onStart, onChunk, signal } = {}) {
    // Get the current access token for authentication
    const token = getAccessToken()

    // Send the message to the backend using the Fetch API
    // Fetch is used here because Axios doesn't support streaming responses well.
    const response = await fetch('/api/v1/chat/conversation', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message,
        ...(conversationId ? { conversationId } : {}),
      }),
      signal,
    })

    // Handle failed requests
    if (!response.ok || !response.body) {
      let errorMessage = 'Unable to send message'

      try {
        const data = await response.json()
        errorMessage = data?.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }

      throw new Error(errorMessage)
    }

    // Read conversation information sent by the backend in response headers
    const serverConversationId = response.headers.get('X-Conversation-Id')
    const title = decodeURIComponent(
      response.headers.get('X-Conversation-Title') || 'New chat'
    )

    // Notify the UI that streaming has started
    onStart?.({
      conversationId: serverConversationId,
      title,
    })

    // Create a stream reader
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // Buffer stores incomplete SSE events
    let buffer = ''

    // Store the complete AI response
    let content = ''

    // Read the stream until the server closes it
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // Decode the received bytes into text
      buffer += decoder.decode(value, { stream: true })

      // SSE events are separated by two new lines
      const events = buffer.split('\n\n')

      // Keep any incomplete event for the next iteration
      buffer = events.pop() || ''

      // Process each complete SSE event
      for (const event of events) {
        const line = event.trim()

        // Ignore invalid events
        if (!line.startsWith('data:')) continue

        // Parse the streamed JSON string
        const text = JSON.parse(line.slice(5).trim())

        // Build the complete AI response
        content += text

        // Send the latest chunk to the UI
        onChunk?.(text)
      }
    }

    // Return the complete streamed response
    return {
      conversationId: serverConversationId,
      title,
      content,
    }
  },
}