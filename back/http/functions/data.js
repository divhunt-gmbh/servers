import { json } from 'node:stream/consumers';
import serversHTTP from '#servers/http/addon.js';

serversHTTP.Fn('data', async function(request) 
{
    const properties = {};
    const url = new URL(request.url, `https://${request.headers.host}`);

    url.searchParams.forEach((value, key) => 
    {
        properties[key] = value;
    });

    if (request.method !== 'GET' && request.headers['content-type']?.includes('application/json')) 
    {
        try 
        {
            const body = await json(request);

            if (body && typeof body === 'object') 
            {
                Object.assign(properties, body);
            }
        }
        catch(error)
        {
            // Invalid JSON, skip body parsing
        }
    }

    const result = {};
    
    for (const [key, value] of Object.entries(properties)) 
    {
        const [base, hint] = key.split(':');
        
        if (!hint) 
        {
            result[key] = value;
            continue;
        }

        if (value === null || value === undefined || value === '') 
        {
            result[base] = null;
            continue;
        }

        switch (hint.toLowerCase()) 
        {
            case 'number':
                const num = Number(value);
                result[base] = isNaN(num) ? null : num;
                break;
                
            case 'string':
                result[base] = String(value);
                break;
                
            case 'boolean':
                result[base] = ['true', '1', true, 1].includes(value) ? true : ['false', '0', false, 0].includes(value) ? false : null;
                break;
                
            case 'array':
                if (Array.isArray(value)) 
                {
                    result[base] = value;
                }
                else if (typeof value === 'string') 
                {
                    try 
                    {
                        const parsed = JSON.parse(value);
                        result[base] = Array.isArray(parsed) ? parsed : value.split(',').map(item => item.trim()).filter(Boolean);
                    } 
                    catch 
                    {
                        result[base] = value.split(',').map(item => item.trim()).filter(Boolean);
                    }
                }
                else 
                {
                    result[base] = null;
                }
                break;
                
            case 'object':
                if (typeof value === 'object' && !Array.isArray(value)) 
                {
                    result[base] = value;
                }
                else if (typeof value === 'string') 
                {
                    try 
                    {
                        const parsed = JSON.parse(value);
                        result[base] = (typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : null;
                    } 
                    catch 
                    {
                        result[base] = null;
                    }
                }
                else 
                {
                    result[base] = null;
                }
                break;
                
            default:
                result[base] = value;
                break;
        }
    }

    return result;
});