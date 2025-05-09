import servers from '#servers/addon.js';

servers.Fn('data.http', function(request) 
{
    const properties = {};
    const url = new URL(request.url, `https://${request.headers.host}`);
    const pathname = url.pathname.toLowerCase();

    url.searchParams.forEach((value, key) => 
    {
        properties[key] = value;
    });

    if (request.method !== 'GET' && request.headers['content-type']?.includes('application/json') && request.body) 
    {
        Object.assign(properties, request.body);
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
                result[base] = ['true', '1', true].includes(value) ? true : ['false', '0', false].includes(value) ? false : null;
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
                        const parsed_json = JSON.parse(value);
                        result[base] = Array.isArray(parsed_json) ? parsed_json : value.split(',').map(item => item.trim());
                    } 
                    catch 
                    {
                        result[base] = value.split(',').map(item => item.trim());
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
                        const parsed_json = JSON.parse(value);
                        result[base] = hint === 'object' && Array.isArray(parsed_json) ? null : parsed_json;
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