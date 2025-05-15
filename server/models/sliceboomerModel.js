import { getPool } from './../config/db.js';
import sql from 'mssql';

export const addFoamMaster = async (req, res) => {
    const { matName, thickNess, width, length } = req.body;
    const query = `
        INSERT INTO SB_Foam_Master (
            materail_name, thickness_block, width_block, length_block
        ) VALUES (
            @material_name, @thickness, @width, @length
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // Add parameters for foam master
        request.input('material_name', sql.NVarChar, matName);
        request.input('thickness', sql.Int, thickNess);
        request.input('width', sql.Int, width);
        request.input('length', sql.Int, length);

        // Execute foam master query
        await request.query(query);

        return res.status(200).json({
            message: 'Master added successfully',
            foam: {
                material_name: matName,
                thickness: thickNess,
                width: width,
                length: length
            }
        });
    } catch (error) {
        console.error('Error adding master:', error);
        throw new Error('Database error');
    }
}

export const addAdjudgment = async (req, res) => {
    const { adjDescription } = req.body;
    const query = `
        INSERT INTO SB_Adjudgment (
            adjudgment_description
        ) VALUES (
            @adjDescription
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // Add parameters for adjudgment
        request.input('adjDescription', sql.NVarChar, adjDescription);

        // Execute adjudgment query
        await request.query(query);

        return res.status(200).json({
            message: 'Adjudgment added successfully',
            adjudgment: {
                adjudgment_description: adjDescription
            }
        });
    } catch (error) {
        console.error('Error adding adjudgment:', error);
        throw new Error('Database error');
    }
}

export const addNgDetail = async (req, res) => {
    const { ngDescription, ngTh } = req.body;
    const query = `
        INSERT INTO SB_NG_Detail (
            ng_description, ng_description_th
        ) VALUES (
            @ngDescription, @ngTh
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // Add parameters for NG detail
        request.input('ngDescription', sql.NVarChar, ngDescription);
        request.input('ngTh', sql.Int, ngTh);

        // Execute NG detail query
        await request.query(query);

        return res.status(200).json({
            message: 'NG detail added successfully',
            ngDetail: {
                ng_description: ngDescription,
                ng_thai: ngTh
            }
        });
    } catch (error) {
        console.error('Error adding NG detail:', error);
        throw new Error('Database error');
    }
}

export const addDescription = async (req, res) => {
    const { descDetail } = req.body;
    const query = `
        INSERT INTO SB_Description (
            description_detail
        ) VALUES (
            @descDetail
        )
    `

    try {
        const pool = await getPool();
        const request = pool.request();

        // Add parameters for description
        request.input('descDetail', sql.NVarChar, descDetail);

        // Execute description query
        await request.query(query);

        return res.status(200).json({
            message: 'Description added successfully',
            description: {
                description_detail: descDetail
            }
        });
    } catch (error) {
        console.error('Error adding description:', error);
        throw new Error('Database error');
    }
}