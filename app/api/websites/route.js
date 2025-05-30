import { promises as fs } from 'fs'
import { NextResponse } from 'next/server'
import path from 'path'

export async function POST(request) {
  try {
    const { name, url, xmlContent } = await request.json()

    // Get the path to the XML file
    const xmlPath = path.join(process.cwd(), 'public', 'websites.xml')

    // Read the current XML file
    let xmlData = await fs.readFile(xmlPath, 'utf-8')

    // Insert the new site before the last closing tag
    xmlData = xmlData.replace('</websites>', `${xmlContent}\n</websites>`)

    // Write the updated XML back to the file
    await fs.writeFile(xmlPath, xmlData, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating XML file:', error)
    return NextResponse.json({ error: 'Failed to update XML file' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()

    // Get the path to the XML file
    const xmlPath = path.join(process.cwd(), 'public', 'websites.xml')

    // Read the current XML file
    let xmlData = await fs.readFile(xmlPath, 'utf-8')

    // Parse the XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml')

    // Get all site elements
    const sites = xmlDoc.getElementsByTagName('site')

    // Remove the site with the matching ID (index + 1)
    if (sites[id - 1]) {
      sites[id - 1].remove()
    }

    // Convert back to string and write to file
    xmlData = xmlDoc.documentElement.outerHTML
    await fs.writeFile(xmlPath, xmlData, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting from XML file:', error)
    return NextResponse.json({ error: 'Failed to delete from XML file' }, { status: 500 })
  }
} 